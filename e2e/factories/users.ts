import { randomInt, randomUUID } from "node:crypto";
import type { AppRole } from "../../src/config/roles";
import { adminClient } from "../fixtures/supabase";

/** Memenuhi aturan password Supabase Auth (minimal 10, huruf besar, huruf kecil, angka). */
export const E2E_PASSWORD = "E2eRahasia2026";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: AppRole | null;
  roles: AppRole[];
}

/** PNG 1x1 untuk foto profil akun test (bucket avatars menerima PNG). */
const AVATAR_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** Email unik per panggilan, supaya test mandiri dan bisa jalan paralel atau diulang. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@e2e.kisgroup.co.id`;
}

/**
 * Membuat akun portal di Supabase lokal lewat API admin (tanpa email undangan). Default: akun
 * lengkap (sudah aktivasi, punya foto profil dan nomor HP) supaya langsung bisa memakai portal.
 * `roles` untuk multi role (elemen pertama role utama), `complete: false` untuk menguji aktivasi.
 */
export async function createPortalUser(
  options: {
    role?: AppRole | null;
    roles?: AppRole[];
    active?: boolean;
    prefix?: string;
    password?: string;
    complete?: boolean;
  } = {},
): Promise<TestUser> {
  const roles = options.roles ?? (options.role === null ? [] : [options.role ?? "marketing"]);
  const role = roles[0] ?? null;
  const password = options.password ?? E2E_PASSWORD;
  const email = uniqueEmail(options.prefix ?? role ?? "tanpa-role");
  const fullName = `Uji ${role ?? "tanpa role"} ${email.slice(-28, -20)}`;
  const admin = adminClient();

  const id = await createAuthUser({ email, password, fullName });

  if (roles.length > 0) {
    const { error: roleError } = await admin
      .from("user_roles")
      .insert(roles.map((item, index) => ({ user_id: id, role: item, is_primary: index === 0 })));
    if (roleError) throw new Error(`Gagal memberi role: ${roleError.message}`);
  }
  if (options.complete !== false) await completeProfile(id);
  if (options.active === false) await setUserActive(id, false);
  return { id, email, password, fullName, role, roles };
}

/**
 * Membuat user di Supabase Auth lokal. Hanya galat batas waktu dari server Auth (runner CI sedang
 * sibuk) yang diulang, maksimal 3 kali. Galat lain langsung menggagalkan test.
 */
async function createAuthUser(input: { email: string; password: string; fullName: string }) {
  for (let attempt = 1; ; attempt += 1) {
    const { data, error } = await adminClient().auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (!error) return data.user.id;
    const timedOut = /timed out/i.test(error.message);
    if (!timedOut || attempt >= 3) throw new Error(`Gagal membuat user test: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
  const { error } = await adminClient()
    .from("profiles")
    .update({ is_active: active })
    .eq("id", userId);
  if (error) throw new Error(`Gagal mengubah status akun: ${error.message}`);
}

/** Menandai akun sudah aktivasi: foto profil, nomor HP, dan waktu aktivasi. */
export async function completeProfile(userId: string): Promise<void> {
  const admin = adminClient();
  const path = `${userId}/foto-uji.png`;
  const upload = await admin.storage
    .from("avatars")
    .upload(path, AVATAR_PNG, { contentType: "image/png", upsert: true });
  if (upload.error) throw new Error(`Gagal mengunggah foto profil test: ${upload.error.message}`);
  const { error } = await admin
    .from("profiles")
    .update({
      avatar_path: path,
      phone: `+62812${String(randomInt(10_000_000, 99_999_999))}`,
      activated_at: new Date().toISOString(),
      needs_password: false,
    })
    .eq("id", userId);
  if (error) throw new Error(`Gagal melengkapi profil test: ${error.message}`);
}
