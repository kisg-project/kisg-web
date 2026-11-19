import { beforeEach, describe, expect, it, vi } from "vitest";

interface Row {
  role?: string;
  is_active?: boolean;
  deleted_at?: string | null;
}

const state = {
  allowed: true,
  claims: null as Record<string, unknown> | null,
  signInError: null as { message: string } | null,
  updateError: null as { code: string } | null,
  role: "marketing" as string | null,
  profile: { is_active: true, deleted_at: null } as Row | null,
};

const auth = {
  signInWithPassword: vi.fn(() =>
    Promise.resolve(
      state.signInError
        ? { data: { user: null }, error: state.signInError }
        : { data: { user: { id: "user-1" } }, error: null },
    ),
  ),
  signOut: vi.fn(() => Promise.resolve({ error: null })),
  resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  getClaims: vi.fn(() => Promise.resolve({ data: state.claims ? { claims: state.claims } : null })),
  updateUser: vi.fn(() => Promise.resolve({ error: state.updateError })),
};

function from(table: string) {
  const row = table === "user_roles" ? (state.role ? { role: state.role } : null) : state.profile;
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: () => Promise.resolve({ data: row, error: null }),
  };
  return query;
}

const hitRateLimit = vi.fn(() => Promise.resolve(state.allowed));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve({ auth, from }),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  clientIp: () => Promise.resolve("203.0.113.9"),
  hitRateLimit,
}));
vi.mock("@/env", () => ({ env: { NEXT_PUBLIC_SITE_URL: "https://kisgroup.co.id" } }));

const { forgotPasswordAction, loginAction, updatePasswordAction } = await import("./auth");

/** Error redirect asli Next (next/navigation) yang diteruskan next-safe-action. */
function redirectTo(path: string): unknown {
  const digest: unknown = expect.stringContaining(`;${path};`);
  return expect.objectContaining({ digest });
}

beforeEach(() => {
  state.allowed = true;
  state.claims = { sub: "user-1", aal: "aal1" };
  state.signInError = null;
  state.updateError = null;
  state.role = "marketing";
  state.profile = { is_active: true, deleted_at: null };
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const credentials = { email: "a@kisgroup.co.id", password: "Rahasia2026" };

describe("loginAction", () => {
  it("mengarahkan ke beranda role setelah berhasil", async () => {
    await expect(loginAction(credentials)).rejects.toEqual(redirectTo("/portal/crm"));
    expect(hitRateLimit).toHaveBeenCalledWith("login-ip", "203.0.113.9", 900, 20);
    expect(hitRateLimit).toHaveBeenCalledWith("login-akun", "a@kisgroup.co.id", 900, 5);
  });

  it("memakai next kalau role boleh membukanya", async () => {
    await expect(loginAction({ ...credentials, next: "/portal/absensi" })).rejects.toEqual(
      redirectTo("/portal/absensi"),
    );
  });

  it("menolak dengan pesan umum kalau password salah", async () => {
    state.signInError = { message: "Invalid login credentials" };
    const result = await loginAction(credentials);
    expect(result.serverError).toBe("Email atau password salah.");
  });

  it("mengunci sementara setelah batas percobaan", async () => {
    state.allowed = false;
    const result = await loginAction(credentials);
    expect(result.serverError).toBe("Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.");
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("mengeluarkan akun nonaktif", async () => {
    state.profile = { is_active: false };
    const result = await loginAction(credentials);
    expect(result.serverError).toBe("Akun Anda tidak aktif. Hubungi admin.");
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("mengeluarkan akun tanpa role", async () => {
    state.role = null;
    const result = await loginAction(credentials);
    expect(result.serverError).toBe("Akun Anda tidak aktif. Hubungi admin.");
  });

  it("menolak input tidak valid sebelum menghubungi server auth", async () => {
    const result = await loginAction({ email: "bukan-email", password: "" });
    expect(result.validationErrors).toBeDefined();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("forgotPasswordAction", () => {
  it("selalu menjawab terkirim dan memakai URL portal", async () => {
    const result = await forgotPasswordAction({ email: "a@kisgroup.co.id" });
    expect(result.data).toEqual({ sent: true });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@kisgroup.co.id", {
      redirectTo: "https://kisgroup.co.id/portal/reset-password",
    });
  });

  it("dibatasi per jam", async () => {
    state.allowed = false;
    const result = await forgotPasswordAction({ email: "a@kisgroup.co.id" });
    expect(result.serverError).toBe("Terlalu banyak permintaan. Coba lagi dalam 1 jam.");
  });
});

describe("updatePasswordAction", () => {
  const input = { password: "Rahasia2026", confirm: "Rahasia2026" };

  it("menyimpan password lalu ke beranda role", async () => {
    await expect(updatePasswordAction(input)).rejects.toEqual(redirectTo("/portal/crm"));
  });

  it("menolak password yang sama dengan sebelumnya", async () => {
    state.updateError = { code: "same_password" };
    const result = await updatePasswordAction(input);
    expect(result.serverError).toBe("Password baru tidak boleh sama dengan password lama.");
  });

  it("memberi arahan kalau gagal karena alasan lain", async () => {
    state.updateError = { code: "unexpected" };
    const result = await updatePasswordAction(input);
    expect(result.serverError).toBe(
      "Password gagal disimpan. Buka lagi tautan dari email, lalu coba lagi.",
    );
  });

  it("menolak tanpa sesi", async () => {
    state.claims = null;
    const result = await updatePasswordAction(input);
    expect(result.serverError).toBe("Sesi berakhir. Silakan masuk lagi.");
  });

  it("menolak akun yang sudah dihapus", async () => {
    state.profile = { is_active: true, deleted_at: "2026-11-01T00:00:00Z" };
    const result = await updatePasswordAction(input);
    expect(result.serverError).toBe("Akun Anda tidak aktif. Hubungi admin.");
  });
});
