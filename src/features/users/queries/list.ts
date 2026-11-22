import "server-only";
import { isAppRole, orderRoles, type AppRole } from "@/config/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { avatarUrls } from "./avatar";

export type AccountStatus = "aktif" | "menunggu_aktivasi" | "nonaktif";

export interface PortalAccount {
  id: string;
  email: string;
  fullName: string;
  roles: AppRole[];
  primaryRole: AppRole | null;
  status: AccountStatus;
  isActive: boolean;
  avatarUrl: string | null;
  invitedAt: string | null;
  createdAt: string;
  hasFingerprint: boolean;
}

export async function listPortalAccounts(): Promise<PortalAccount[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, is_active, created_at, invited_at, activated_at, avatar_path, user_roles(role, is_primary)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat karyawan: ${error.message}`);
  const [urls, fingerprints] = await Promise.all([
    avatarUrls(data.map((row) => row.avatar_path)),
    supabase.from("webauthn_credentials").select("user_id").is("revoked_at", null),
  ]);
  const withFingerprint = new Set((fingerprints.data ?? []).map((row) => row.user_id));
  return data.map((row) => {
    const primary = row.user_roles.find((item) => item.is_primary)?.role;
    const primaryRole = primary && isAppRole(primary) ? primary : null;
    const roles = orderRoles(
      row.user_roles.map((item) => item.role).filter(isAppRole),
      primaryRole ?? undefined,
    );
    const status: AccountStatus = !row.is_active
      ? "nonaktif"
      : row.activated_at
        ? "aktif"
        : "menunggu_aktivasi";
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      roles,
      primaryRole: roles[0] ?? null,
      status,
      isActive: row.is_active,
      avatarUrl: row.avatar_path ? (urls.get(row.avatar_path) ?? null) : null,
      invitedAt: row.invited_at,
      createdAt: row.created_at,
      hasFingerprint: withFingerprint.has(row.id),
    };
  });
}
