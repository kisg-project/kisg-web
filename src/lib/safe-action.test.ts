import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const state = {
  claims: { sub: "user-1" } as Record<string, unknown> | null,
  roles: [{ role: "marketing", is_primary: true }] as { role: string; is_primary: boolean }[],
  active: true,
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: {
        getClaims: () => Promise.resolve({ data: state.claims ? { claims: state.claims } : null }),
      },
      from: (table: string) => {
        const profile = {
          email: "user@kis.test",
          full_name: "User",
          phone: null,
          avatar_path: null,
          activated_at: null,
          needs_password: false,
          is_active: state.active,
          deleted_at: null,
        };
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: () => Promise.resolve({ data: profile, error: null }),
          // user_roles dibaca sebagai daftar (multi role).
          then: (resolve: (value: unknown) => void) => {
            resolve({ data: table === "user_roles" ? state.roles : [], error: null });
          },
        };
        return query;
      },
    }),
}));

const { ActionError, actionClient, authActionClient, roleActionClient } =
  await import("./safe-action");

beforeEach(() => {
  state.claims = { sub: "user-1" };
  state.roles = [{ role: "marketing", is_primary: true }];
  state.active = true;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("actionClient", () => {
  it("menampilkan pesan ActionError apa adanya", async () => {
    const action = actionClient.action(() => {
      throw new ActionError("Pesan untuk pengguna.");
    });
    expect((await action()).serverError).toBe("Pesan untuk pengguna.");
  });

  it("menyembunyikan detail error lain", async () => {
    const action = actionClient.action(() => {
      throw new Error("relation leads does not exist");
    });
    expect((await action()).serverError).toBe(
      "Terjadi kesalahan di server. Coba lagi sebentar lagi.",
    );
  });
});

describe("authActionClient", () => {
  it("meneruskan user, role utama, dan semua role ke aksi", async () => {
    state.roles = [
      { role: "marketing", is_primary: false },
      { role: "finance", is_primary: true },
    ];
    const action = authActionClient.action(({ ctx }) =>
      Promise.resolve({ userId: ctx.userId, role: ctx.role, roles: ctx.roles }),
    );
    expect((await action()).data).toEqual({
      userId: "user-1",
      role: "finance",
      roles: ["finance", "marketing"],
    });
  });

  it("menolak akun nonaktif", async () => {
    state.active = false;
    const action = authActionClient.action(() => Promise.resolve(1));
    expect((await action()).serverError).toBe("Akun Anda tidak aktif. Hubungi owner.");
  });
});

describe("roleActionClient", () => {
  const action = roleActionClient(["owner", "admin"])
    .inputSchema(z.object({ id: z.string() }))
    .action(({ parsedInput }) => Promise.resolve(parsedInput.id));

  it("menolak role di luar daftar", async () => {
    expect((await action({ id: "x" })).serverError).toBe("Anda tidak punya akses untuk aksi ini.");
  });

  it("mengizinkan role di daftar", async () => {
    state.roles = [{ role: "owner", is_primary: true }];
    expect((await action({ id: "x" })).data).toBe("x");
  });

  it("multi role: cukup salah satu role cocok", async () => {
    state.roles = [
      { role: "marketing", is_primary: true },
      { role: "owner", is_primary: false },
    ];
    expect((await action({ id: "x" })).data).toBe("x");
  });
});
