import "server-only";
import { isAppRole, orderRoles, type AppRole } from "@/config/roles";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface AccountRoles {
  /** Semua role akun aktif, role utama di depan. Kosong kalau akun nonaktif atau tanpa role. */
  roles: AppRole[];
  profile: {
    email: string;
    fullName: string;
    phone: string | null;
    avatarPath: string | null;
    activatedAt: string | null;
    needsPassword: boolean;
  } | null;
}

/**
 * Role dan profil akun dibaca dari database (bukan JWT), supaya perubahan role atau penonaktifan
 * akun langsung berlaku. Dipakai sesi portal, server action, dan login.
 */
export async function loadAccountRoles(
  supabase: ServerClient,
  userId: string,
): Promise<AccountRoles> {
  const [roleResult, profileResult] = await Promise.all([
    supabase.from("user_roles").select("role, is_primary").eq("user_id", userId),
    supabase
      .from("profiles")
      .select(
        "email, full_name, phone, avatar_path, activated_at, needs_password, is_active, deleted_at",
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);
  const profile = profileResult.data;
  if (!profile?.is_active || profile.deleted_at) return { roles: [], profile: null };
  const rows = roleResult.data ?? [];
  const primary = rows.find((row) => row.is_primary)?.role;
  const roles = orderRoles(
    rows.map((row) => row.role).filter(isAppRole),
    primary && isAppRole(primary) ? primary : undefined,
  );
  return {
    roles,
    profile: {
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarPath: profile.avatar_path,
      activatedAt: profile.activated_at,
      needsPassword: profile.needs_password,
    },
  };
}
