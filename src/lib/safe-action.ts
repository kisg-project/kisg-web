import "server-only";
import { createSafeActionClient } from "next-safe-action";
import { isAppRole, type AppRole } from "@/config/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Error yang pesannya aman ditampilkan ke pengguna. Error lain diganti pesan umum. */
export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof ActionError) return error.message;
    console.error("Server action gagal", error);
    return "Terjadi kesalahan di server. Coba lagi sebentar lagi.";
  },
});

/**
 * Wajib sesi aktif. Role dan status aktif dibaca dari database (bukan JWT) supaya perubahan role
 * atau penonaktifan akun berlaku seketika.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new ActionError("Sesi berakhir. Silakan masuk lagi.");

  const [roleResult, profileResult] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("is_active, deleted_at").eq("id", userId).maybeSingle(),
  ]);
  const role = roleResult.data?.role;
  const profile = profileResult.data;
  if (!role || !isAppRole(role) || !profile?.is_active || profile.deleted_at) {
    throw new ActionError("Akun Anda tidak aktif. Hubungi admin.");
  }
  return next({
    ctx: { supabase, userId, role, aal: data.claims.aal },
  });
});

/** Wajib salah satu role. Dipakai untuk aksi admin, owner, dan modul per divisi. */
export function roleActionClient(roles: readonly AppRole[]) {
  return authActionClient.use(async ({ next, ctx }) => {
    if (!roles.includes(ctx.role)) {
      throw new ActionError("Anda tidak punya akses untuk aksi ini.");
    }
    return next({ ctx });
  });
}
