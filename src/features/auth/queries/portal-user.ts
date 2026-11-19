import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isAppRole, type AppRole } from "@/config/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  aal: string;
}

interface PortalSession {
  signedIn: boolean;
  user: PortalUser | null;
}

/**
 * Sesi portal saat ini. Role dan status aktif dibaca dari database, bukan JWT, supaya perubahan role
 * atau penonaktifan akun langsung berlaku. Di-cache per request.
 */
const getPortalSession = cache(async (): Promise<PortalSession> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { signedIn: false, user: null };

  const [roleResult, profileResult] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase
      .from("profiles")
      .select("email, full_name, is_active, deleted_at")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  const role = roleResult.data?.role;
  const profile = profileResult.data;
  if (!role || !isAppRole(role) || !profile?.is_active || profile.deleted_at) {
    return { signedIn: true, user: null };
  }
  return {
    signedIn: true,
    user: {
      id: userId,
      email: profile.email,
      fullName: profile.full_name,
      role,
      aal: typeof data.claims.aal === "string" ? data.claims.aal : "aal1",
    },
  };
});

/** User portal yang aktif, atau null kalau belum login atau akunnya nonaktif. */
export async function getPortalUser(): Promise<PortalUser | null> {
  return (await getPortalSession()).user;
}

/**
 * Wajib login dengan salah satu role. Belum login: ke halaman masuk. Akun nonaktif atau tanpa role:
 * sesi diakhiri lewat /portal/auth/keluar (Server Component tidak bisa menghapus cookie sendiri).
 * Role tidak cocok: ke halaman akses ditolak.
 */
export async function requirePortalUser(roles?: readonly AppRole[]): Promise<PortalUser> {
  const { signedIn, user } = await getPortalSession();
  if (!signedIn) redirect("/portal/login");
  if (!user) redirect("/portal/auth/keluar?alasan=nonaktif");
  if (roles && !roles.includes(user.role)) redirect("/portal/akses-ditolak");
  return user;
}
