import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const state = {
  claims: { sub: "user-1", aal: "aal2" } as Record<string, unknown> | null,
  role: "marketing",
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: {
        getClaims: () => Promise.resolve({ data: state.claims ? { claims: state.claims } : null }),
      },
      from: (table: string) => {
        const row =
          table === "user_roles" ? { role: state.role } : { is_active: true, deleted_at: null };
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: () => Promise.resolve({ data: row, error: null }),
        };
        return query;
      },
    }),
}));

const { ActionError, actionClient, authActionClient, roleActionClient } =
  await import("./safe-action");

beforeEach(() => {
  state.claims = { sub: "user-1", aal: "aal2" };
  state.role = "marketing";
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
  it("meneruskan user, role, dan level AAL ke aksi", async () => {
    const action = authActionClient.action(({ ctx }) =>
      Promise.resolve({ userId: ctx.userId, role: ctx.role, aal: ctx.aal }),
    );
    expect((await action()).data).toEqual({ userId: "user-1", role: "marketing", aal: "aal2" });
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
    state.role = "admin";
    expect((await action({ id: "x" })).data).toBe("x");
  });
});
