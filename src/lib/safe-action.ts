import "server-only";
import { createSafeActionClient } from "next-safe-action";
import type { AppRole } from "@/config/roles";
import { loadAccountRoles } from "@/lib/auth/account-roles";
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
 * atau penonaktifan akun berlaku seketika. `role` adalah role utama, `roles` semua role akun.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new ActionError("Sesi berakhir. Silakan masuk lagi.");

  const { roles, profile } = await loadAccountRoles(supabase, userId);
  const [role] = roles;
  if (!role || !profile) throw new ActionError("Akun Anda tidak aktif. Hubungi owner.");
  return next({ ctx: { supabase, userId, role, roles, email: profile.email } });
});

/** Wajib salah satu role (multi role: cukup salah satu role akun cocok). */
export function roleActionClient(allowed: readonly AppRole[]) {
  return authActionClient.use(async ({ next, ctx }) => {
    if (!ctx.roles.some((role) => allowed.includes(role))) {
      throw new ActionError("Anda tidak punya akses untuk aksi ini.");
    }
    return next({ ctx });
  });
}

/** Aksi pengelola akun dan pengaturan: owner (dan akun admin lama sampai dinonaktifkan). */
export const adminActionClient = roleActionClient(["owner", "admin"]);
