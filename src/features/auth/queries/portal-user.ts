import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { mustAttend } from "@/config/attendance";
import type { AppRole } from "@/config/roles";
import { loadAccountRoles } from "@/lib/auth/account-roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  /** Role utama: menentukan beranda dan label utama. */
  role: AppRole;
  /** Semua role (multi role). Hak akses adalah gabungan semuanya. */
  roles: AppRole[];
  phone: string | null;
  avatarPath: string | null;
  /** true kalau aktivasi lengkap: password, foto profil, dan nomor HP. */
  complete: boolean;
  needsPassword: boolean;
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
  // Sesi hanya dibaca saat request nyata, tidak saat prerender (Supabase memakai Date.now()).
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { signedIn: false, user: null };

  const { roles, profile } = await loadAccountRoles(supabase, userId);
  const [role] = roles;
  if (!role || !profile) return { signedIn: true, user: null };
  return {
    signedIn: true,
    user: {
      id: userId,
      email: profile.email,
      fullName: profile.fullName,
      role,
      roles,
      phone: profile.phone,
      avatarPath: profile.avatarPath,
      needsPassword: profile.needsPassword,
      complete: Boolean(
        profile.activatedAt && profile.avatarPath && profile.phone && !profile.needsPassword,
      ),
    },
  };
});

/** User portal yang aktif, atau null kalau belum login atau akunnya nonaktif. */
export async function getPortalUser(): Promise<PortalUser | null> {
  return (await getPortalSession()).user;
}

/**
 * Wajib login dengan salah satu role (multi role: cukup salah satu cocok). Belum login: ke halaman
 * masuk. Akun nonaktif atau tanpa role: sesi diakhiri lewat /portal/auth/keluar (Server Component
 * tidak bisa menghapus cookie sendiri). Role tidak cocok: ke halaman akses ditolak. Aktivasi belum
 * lengkap (password, foto profil, nomor HP): ke /portal/aktivasi, kecuali halaman itu sendiri.
 */
export async function requirePortalUser(
  roles?: readonly AppRole[],
  options: { allowIncomplete?: boolean; skipWorkReport?: boolean } = {},
): Promise<PortalUser> {
  const { signedIn, user } = await getPortalSession();
  if (!signedIn) redirect("/portal/login");
  if (!user) redirect("/portal/auth/keluar?alasan=nonaktif");
  if (!user.complete && !options.allowIncomplete) redirect("/portal/aktivasi");
  if (roles && !roles.some((role) => user.roles.includes(role))) redirect("/portal/akses-ditolak");
  if (!options.skipWorkReport && mustAttend(user.roles)) {
    const target = await pendingWorkReport(user.id);
    if (target) redirect(target);
  }
  return user;
}

/**
 * Laporan harian wajib (keputusan owner, 20 November 2026): sudah clock in tapi belum ada rencana,
 * ke formulir rencana. Sudah clock out tapi belum ada hasil, ke formulir hasil. Selain itu null.
 */
const pendingWorkReport = cache(async (userId: string): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const [{ data: record }, { data: reports }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("clock_out_at")
      .eq("user_id", userId)
      .eq("work_date", today)
      .maybeSingle(),
    supabase.from("work_reports").select("kind").eq("user_id", userId).eq("work_date", today),
  ]);
  if (!record) return null;
  const kinds = new Set((reports ?? []).map((row) => row.kind));
  if (!kinds.has("rencana")) return "/portal/absensi/rencana";
  if (record.clock_out_at && !kinds.has("hasil")) return "/portal/absensi/hasil";
  return null;
});
