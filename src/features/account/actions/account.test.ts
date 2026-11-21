import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  avatarPath: "user-1/foto.webp" as string | null,
  needsPassword: true,
  updateUserError: null as { code: string } | null,
  reauthError: null as { message: string } | null,
  verifyError: null as { message: string } | null,
  allowed: true,
};
const profileUpdates: Record<string, unknown>[] = [];
const adminUpdates: Record<string, unknown>[] = [];
const updateUser = vi.fn<(attrs: { password: string; nonce?: string }) => Promise<unknown>>(() =>
  Promise.resolve({ error: state.updateUserError }),
);
const resetPasswordForEmail = vi.fn<(email: string) => Promise<unknown>>(() =>
  Promise.resolve({ error: state.reauthError }),
);
const verifyOtp = vi.fn<
  (input: { email: string; token: string; type: string }) => Promise<unknown>
>(() =>
  Promise.resolve(
    state.verifyError
      ? { data: { user: null }, error: state.verifyError }
      : { data: { user: { id: "user-1" } }, error: null },
  ),
);

function from(target: Record<string, unknown>[]) {
  return (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      update: (values: Record<string, unknown>) => {
        target.push(values);
        return query;
      },
      maybeSingle: () =>
        Promise.resolve({
          data: {
            email: "budi@kis.test",
            full_name: "Budi",
            phone: null,
            avatar_path: state.avatarPath,
            activated_at: null,
            needs_password: state.needsPassword,
            is_active: true,
            deleted_at: null,
          },
          error: null,
        }),
      then: (resolve: (value: unknown) => void) => {
        resolve(
          table === "user_roles"
            ? { data: [{ role: "site_supervisor", is_primary: true }], error: null }
            : { error: null },
        );
      },
    };
    return query;
  };
}

vi.mock("@/env", () => ({ env: {} }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabaseConfig: () => ({ url: "http://127.0.0.1:54321", publishableKey: "pk" }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { verifyOtp, signOut: () => Promise.resolve({}) } }),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  hitRateLimit: () => Promise.resolve(state.allowed),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: {
        getClaims: () => Promise.resolve({ data: { claims: { sub: "user-1" } } }),
        updateUser,
        resetPasswordForEmail,
      },
      from: from(profileUpdates),
    }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from: from(adminUpdates) }),
}));

const { activateAccountAction, changePasswordAction, sendPasswordCodeAction, updateProfileAction } =
  await import("./account");

function redirectTo(path: string): unknown {
  const digest: unknown = expect.stringContaining(`;${path};`);
  return expect.objectContaining({ digest });
}

const activation = {
  fullName: "Budi Santoso",
  phone: "0812 7777 1234",
  needsPassword: true,
  password: "Rahasia2026x",
  confirm: "Rahasia2026x",
};

beforeEach(() => {
  state.avatarPath = "user-1/foto.webp";
  state.needsPassword = true;
  state.updateUserError = null;
  state.reauthError = null;
  state.verifyError = null;
  state.allowed = true;
  profileUpdates.length = 0;
  adminUpdates.length = 0;
  updateUser.mockClear();
  resetPasswordForEmail.mockClear();
  verifyOtp.mockClear();
});

describe("activateAccountAction", () => {
  it("menyimpan password, nama, nomor HP E.164, menandai aktif, lalu ke beranda role", async () => {
    await expect(activateAccountAction(activation)).rejects.toEqual(redirectTo("/portal/lapangan"));
    expect(updateUser).toHaveBeenCalledWith({ password: "Rahasia2026x" });
    expect(profileUpdates).toContainEqual({ full_name: "Budi Santoso", phone: "+6281277771234" });
    expect(adminUpdates[0]).toMatchObject({ needs_password: false });
    expect(adminUpdates[0]?.activated_at).toEqual(expect.any(String));
  });

  it("wajib foto profil", async () => {
    state.avatarPath = null;
    expect((await activateAccountAction(activation)).serverError).toBe(
      "Ambil atau pilih foto profil dulu.",
    );
  });

  it("server tidak percaya needsPassword dari browser", async () => {
    const result = await activateAccountAction({
      ...activation,
      needsPassword: false,
      password: "",
      confirm: "",
    });
    expect(result.serverError).toBe("Buat password untuk akun Anda.");
  });

  it("akun lama boleh tanpa password", async () => {
    state.needsPassword = false;
    await expect(
      activateAccountAction({ ...activation, needsPassword: false, password: "", confirm: "" }),
    ).rejects.toEqual(redirectTo("/portal/lapangan"));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("password lemah dari Supabase diberi pesan jelas", async () => {
    state.updateUserError = { code: "weak_password" };
    expect((await activateAccountAction(activation)).serverError).toMatch(/terlalu lemah/);
  });
});

describe("updateProfileAction dan changePasswordAction", () => {
  it("mengubah nama dan nomor HP", async () => {
    expect((await updateProfileAction({ fullName: "Budi", phone: "081299998888" })).data).toEqual({
      ok: true,
    });
    expect(profileUpdates).toContainEqual({ full_name: "Budi", phone: "+6281299998888" });
  });

  const change = {
    code: "123456",
    password: "BaruRahasia2027",
    confirm: "BaruRahasia2027",
  };

  it("kode dikirim ke email akun", async () => {
    expect((await sendPasswordCodeAction()).data).toEqual({ sentTo: "budi@kis.test" });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("budi@kis.test");
  });

  it("kode gagal dikirim memberi pesan yang jelas", async () => {
    state.reauthError = { message: "rate limit" };
    expect((await sendPasswordCodeAction()).serverError).toBe(
      "Kode belum terkirim. Coba lagi sebentar lagi.",
    );
  });

  it("pengiriman kode dibatasi", async () => {
    state.allowed = false;
    expect((await sendPasswordCodeAction()).serverError).toMatch(/Coba lagi dalam 15 menit/);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("kode dicek dulu, lalu password baru disimpan", async () => {
    expect((await changePasswordAction(change)).data).toEqual({ ok: true });
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "budi@kis.test",
      token: "123456",
      type: "recovery",
    });
    expect(updateUser).toHaveBeenCalledWith({ password: "BaruRahasia2027" });
  });

  it("kode salah ditolak dan password tidak diubah", async () => {
    state.verifyError = { message: "Token has expired or is invalid" };
    expect((await changePasswordAction(change)).serverError).toBe(
      "Kode salah atau sudah tidak berlaku. Minta kode baru.",
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("kode bukan 6 digit ditolak sebelum ke server", async () => {
    const result = await changePasswordAction({ ...change, code: "12ab" });
    expect(result.validationErrors?.code?._errors?.[0]).toBe("Masukkan 6 digit kode dari email.");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("dibatasi percobaan", async () => {
    state.allowed = false;
    expect((await changePasswordAction(change)).serverError).toMatch(/Terlalu banyak percobaan/);
  });
});
