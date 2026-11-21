import { beforeEach, describe, expect, it, vi } from "vitest";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const TARGET = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const state = {
  actorRoles: ["owner"] as string[],
  targetRoles: ["marketing"] as string[],
  targetActivated: null as string | null,
  linkError: null as { code?: string; message: string } | null,
  rpcError: null as { message: string } | null,
  emailSent: true,
};

const rpc = vi.fn<(name: string, args: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve({ error: state.rpcError }),
);
const generateLink = vi.fn<(args: { type: string; email: string }) => Promise<unknown>>((args) =>
  Promise.resolve(
    state.linkError
      ? { data: null, error: state.linkError }
      : {
          data: { user: { id: TARGET }, properties: { hashed_token: `tok-${args.type}` } },
          error: null,
        },
  ),
);
const updateUserById = vi.fn<(id: string, attrs: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve({ error: null }),
);
const deleteUser = vi.fn<(id: string) => Promise<unknown>>(() => Promise.resolve({ error: null }));
const profileUpdates: Record<string, unknown>[] = [];
const sendInviteEmail = vi.fn<(input: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve(
    state.emailSent ? { sent: true, provider: "mailpit" } : { sent: false, provider: "none" },
  ),
);

/** Query builder tiruan: daftar role (thenable) dan satu baris profil (maybeSingle). */
function from(table: string) {
  let target = "";
  const query = {
    select: () => query,
    update: (values: Record<string, unknown>) => {
      profileUpdates.push(values);
      return query;
    },
    eq: (_column: string, value: string) => {
      target = value;
      return query;
    },
    maybeSingle: () =>
      Promise.resolve({
        data: {
          email: target === ACTOR ? "owner@kis.test" : "budi@kis.test",
          full_name: target === ACTOR ? "Bu Owner" : "Budi",
          phone: null,
          avatar_path: null,
          activated_at: target === ACTOR ? "2026-11-20T00:00:00Z" : state.targetActivated,
          needs_password: false,
          is_active: true,
          deleted_at: null,
        },
        error: null,
      }),
    then: (resolve: (value: unknown) => void) => {
      if (table !== "user_roles") {
        resolve({ error: null });
        return;
      }
      const roles = target === ACTOR ? state.actorRoles : state.targetRoles;
      resolve({
        data: roles.map((role, index) => ({ role, is_primary: index === 0 })),
        error: null,
      });
    },
  };
  return query;
}

vi.mock("@/env", () => ({ env: {} }));
vi.mock("@/features/notifications", () => ({ sendInviteEmail }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getClaims: () => Promise.resolve({ data: { claims: { sub: ACTOR } } }) },
      from,
      rpc,
    }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: { admin: { generateLink, updateUserById, deleteUser } },
    from,
  }),
}));
vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({ get: (name: string) => (name === "host" ? "kisg-web.vercel.app" : null) }),
}));

const {
  cancelInviteAction,
  inviteUserAction,
  resendInviteAction,
  setUserActiveAction,
  setUserRolesAction,
} = await import("./users");

beforeEach(() => {
  state.actorRoles = ["owner"];
  state.targetRoles = ["marketing"];
  state.targetActivated = null;
  state.linkError = null;
  state.rpcError = null;
  state.emailSent = true;
  profileUpdates.length = 0;
  for (const mock of [rpc, generateLink, updateUserById, deleteUser, sendInviteEmail]) {
    mock.mockClear();
  }
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const invite = {
  fullName: "Budi",
  email: "Budi@KIS.co.id",
  roles: ["marketing", "finance"] as ("marketing" | "finance")[],
  primaryRole: "finance" as const,
};

describe("inviteUserAction", () => {
  it("membuat akun multi role, menandai perlu password, dan mengirim email undangan", async () => {
    const result = await inviteUserAction(invite);
    expect(result.data).toEqual({
      email: "budi@kis.co.id",
      link: "https://kisg-web.vercel.app/portal/auth/confirm?token_hash=tok-invite&type=invite&next=%2Fportal%2Faktivasi",
      emailed: true,
    });
    expect(rpc).toHaveBeenCalledWith("set_user_roles", {
      p_user: TARGET,
      p_roles: ["finance", "marketing"],
      p_primary: "finance",
    });
    expect(profileUpdates).toContainEqual(
      expect.objectContaining({ needs_password: true, invited_by: ACTOR, activated_at: null }),
    );
    expect(sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "budi@kis.co.id", inviterName: "Bu Owner" }),
    );
  });

  it("email belum dikonfigurasi: tautan tetap dikembalikan", async () => {
    state.emailSent = false;
    expect((await inviteUserAction(invite)).data?.emailed).toBe(false);
  });

  it("email terdaftar ditolak dengan pesan jelas", async () => {
    state.linkError = { code: "email_exists", message: "exists" };
    expect((await inviteUserAction(invite)).serverError).toMatch(/Email sudah terdaftar/);
  });

  it("akun tanpa role dihapus kalau role gagal disimpan", async () => {
    state.rpcError = { message: "gagal" };
    await inviteUserAction(invite);
    expect(deleteUser).toHaveBeenCalledWith(TARGET);
  });

  it("role di luar owner ditolak", async () => {
    state.actorRoles = ["marketing"];
    expect((await inviteUserAction(invite)).serverError).toMatch(/tidak punya akses/);
  });

  it("akun admin lama tidak bisa mengundang owner", async () => {
    state.actorRoles = ["admin"];
    expect(
      (await inviteUserAction({ ...invite, roles: ["owner"], primaryRole: "owner" })).serverError,
    ).toMatch(/hanya bisa diubah oleh owner/);
  });
});

describe("undangan yang belum diaktivasi", () => {
  it("kirim ulang memakai tautan baru", async () => {
    const result = await resendInviteAction({ userId: TARGET });
    expect(result.data?.link).toContain("type=invite");
    expect(sendInviteEmail).toHaveBeenCalledTimes(1);
  });

  it("kirim ulang memakai magic link kalau tautan pertama sudah dibuka", async () => {
    generateLink.mockImplementationOnce(() =>
      Promise.resolve({ data: null, error: { code: "email_exists", message: "exists" } }),
    );
    expect((await resendInviteAction({ userId: TARGET })).data?.link).toContain("type=magiclink");
  });

  it("akun yang sudah aktif tidak bisa dikirim ulang atau dibatalkan", async () => {
    state.targetActivated = "2026-11-20T00:00:00Z";
    expect((await resendInviteAction({ userId: TARGET })).serverError).toMatch(/sudah aktif/);
    expect((await cancelInviteAction({ userId: TARGET })).serverError).toMatch(/sudah aktif/);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("batalkan menghapus akun undangan", async () => {
    expect((await cancelInviteAction({ userId: TARGET })).data).toEqual({ ok: true });
    expect(deleteUser).toHaveBeenCalledWith(TARGET);
  });
});

describe("setUserRolesAction dan setUserActiveAction", () => {
  it("mengubah semua role sekaligus dengan role utama di depan", async () => {
    expect(
      (
        await setUserRolesAction({
          userId: TARGET,
          roles: ["marketing", "site_supervisor"],
          primaryRole: "site_supervisor",
        })
      ).data,
    ).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("set_user_roles", {
      p_user: TARGET,
      p_roles: ["site_supervisor", "marketing"],
      p_primary: "site_supervisor",
    });
  });

  it("akun admin lama tidak bisa mengubah akun yang memegang owner", async () => {
    state.actorRoles = ["admin"];
    state.targetRoles = ["finance", "owner"];
    expect(
      (await setUserRolesAction({ userId: TARGET, roles: ["finance"], primaryRole: "finance" }))
        .serverError,
    ).toMatch(/hanya bisa diubah oleh owner/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("menonaktifkan akun sekaligus memblokirnya di Auth, dan mengaktifkan membuka blokir", async () => {
    await setUserActiveAction({ userId: TARGET, active: false });
    expect(updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: "876000h" });
    await setUserActiveAction({ userId: TARGET, active: true });
    expect(updateUserById).toHaveBeenLastCalledWith(TARGET, { ban_duration: "none" });
  });
});
