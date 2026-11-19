import { randomUUID } from "node:crypto";
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
}

/** Email unik per panggilan, supaya test mandiri dan bisa jalan paralel atau diulang. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@e2e.kisgroup.co.id`;
}

/** Membuat akun portal di Supabase lokal lewat API admin (tanpa email undangan). */
export async function createPortalUser(
  options: { role?: AppRole | null; active?: boolean; prefix?: string; password?: string } = {},
): Promise<TestUser> {
  const role = options.role === undefined ? "marketing" : options.role;
  const password = options.password ?? E2E_PASSWORD;
  const email = uniqueEmail(options.prefix ?? role ?? "tanpa-role");
  const fullName = `Uji ${role ?? "tanpa role"} ${email.slice(-28, -20)}`;
  const admin = adminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`Gagal membuat user test: ${error.message}`);
  const id = data.user.id;

  if (role) {
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: id, role });
    if (roleError) throw new Error(`Gagal memberi role: ${roleError.message}`);
  }
  if (options.active === false) await setUserActive(id, false);
  return { id, email, password, fullName, role };
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
  const { error } = await adminClient()
    .from("profiles")
    .update({ is_active: active })
    .eq("id", userId);
  if (error) throw new Error(`Gagal mengubah status akun: ${error.message}`);
}
