import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  role: "admin" as string,
  targetRole: "marketing" as string | null,
  linkError: null as { code?: string; message: string } | null,
  rpcError: null as { message: string } | null,
};
const rpc = vi.fn<(name: string, args: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve({ error: state.rpcError }),
);
const generateLink = vi.fn(() =>
  Promise.resolve(
    state.linkError
      ? { data: null, error: state.linkError }
      : { data: { user: { id: "new-user" }, properties: { hashed_token: "tok123" } }, error: null },
  ),
);
const updateUserById = vi.fn<(id: string, attrs: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve({ error: null }),
);
const deleteUser = vi.fn(() => Promise.resolve({ error: null }));

function from(table: string) {
  const query = {
    select: () => query,
    eq: (_column: string, value: string) => {
      query.target = value;
      return query;
    },
    target: "",
    maybeSingle: () => {
      if (table === "user_roles" && query.target === "admin-1") {
        return Promise.resolve({ data: { role: state.role }, error: null });
      }
      if (table === "user_roles") {
        return Promise.resolve({
          data: state.targetRole ? { role: state.targetRole } : null,
          error: null,
        });
      }
      return Promise.resolve({ data: { is_active: true, deleted_at: null }, error: null });
    },
  };
  return query;
}

vi.mock("@/env", () => ({ env: {} }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: {
        getClaims: () => Promise.resolve({ data: { claims: { sub: "admin-1", aal: "aal1" } } }),
      },
      from,
      rpc,
    }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: { admin: { generateLink, updateUserById, deleteUser } },
  }),
}));
vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({ get: (name: string) => (name === "host" ? "kisg-web.vercel.app" : null) }),
}));

const { inviteUserAction, setUserActiveAction, setUserRoleAction } = await import("./users");

beforeEach(() => {
  state.role = "admin";
  state.targetRole = "marketing";
  state.linkError = null;
  state.rpcError = null;
  rpc.mockClear();
  updateUserById.mockClear();
  deleteUser.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("inviteUserAction", () => {
  it("membuat akun, menetapkan role, dan mengembalikan tautan undangan portal", async () => {
    const result = await inviteUserAction({
      fullName: "Budi",
      email: "Budi@KIS.co.id",
      role: "owner",
    });
    expect(result.data).toEqual({
      email: "budi@kis.co.id",
      link: "https://kisg-web.vercel.app/portal/auth/confirm?token_hash=tok123&type=invite&next=%2Fportal%2Freset-password",
    });
    expect(rpc).toHaveBeenCalledWith("set_user_role", { p_user: "new-user", p_role: "owner" });
  });

  it("email terdaftar ditolak dengan pesan jelas", async () => {
    state.linkError = { code: "email_exists", message: "exists" };
    expect(
      (await inviteUserAction({ fullName: "Budi", email: "b@kis.co.id", role: "marketing" }))
        .serverError,
    ).toMatch(/Email sudah terdaftar/);
  });

  it("akun tanpa role dihapus kalau role gagal disimpan", async () => {
    state.rpcError = { message: "gagal" };
    await inviteUserAction({ fullName: "Budi", email: "b@kis.co.id", role: "marketing" });
    expect(deleteUser).toHaveBeenCalledWith("new-user");
  });

  it("role selain owner/admin ditolak", async () => {
    state.role = "marketing";
    expect(
      (await inviteUserAction({ fullName: "Budi", email: "b@kis.co.id", role: "marketing" }))
        .serverError,
    ).toMatch(/tidak punya akses/);
  });
});

describe("setUserRoleAction dan setUserActiveAction", () => {
  const userId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

  it("mengubah role akun lain", async () => {
    expect((await setUserRoleAction({ userId, role: "finance" })).data).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("set_user_role", { p_user: userId, p_role: "finance" });
  });

  it("admin tidak boleh mengubah akun owner", async () => {
    state.targetRole = "owner";
    expect((await setUserRoleAction({ userId, role: "finance" })).serverError).toMatch(
      /hanya bisa diubah oleh owner/,
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it("menonaktifkan akun sekaligus memblokirnya di Auth, dan mengaktifkan membuka blokir", async () => {
    await setUserActiveAction({ userId, active: false });
    expect(updateUserById).toHaveBeenLastCalledWith(userId, { ban_duration: "876000h" });
    await setUserActiveAction({ userId, active: true });
    expect(updateUserById).toHaveBeenLastCalledWith(userId, { ban_duration: "none" });
  });
});
