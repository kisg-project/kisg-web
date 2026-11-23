import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { mustAttend } from "@/config/attendance";
import type { AppRole } from "@/config/roles";
import { loadAccountRoles, type InheritedDuty } from "@/lib/auth/account-roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PortalUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  roles: AppRole[];
  duties: InheritedDuty[];
  phone: string | null;
  avatarPath: string | null;
  complete: boolean;
  needsPassword: boolean;
}

interface PortalSession {
  signedIn: boolean;
  user: PortalUser | null;
}

const getPortalSession = cache(async (): Promise<PortalSession> => {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { signedIn: false, user: null };

  const { roles, duties, profile } = await loadAccountRoles(supabase, userId);
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
      duties,
      phone: profile.phone,
      avatarPath: profile.avatarPath,
      needsPassword: profile.needsPassword,
      complete: Boolean(
        profile.activatedAt && profile.avatarPath && profile.phone && !profile.needsPassword,
      ),
    },
  };
});

export async function getPortalUser(): Promise<PortalUser | null> {
  return (await getPortalSession()).user;
}

export async function requirePortalUser(
  roles?: readonly AppRole[],
  options: { allowIncomplete?: boolean; skipWorkReport?: boolean } = {},
): Promise<PortalUser> {
  const { signedIn, user } = await getPortalSession();
  if (!signedIn) redirect("/portal/login");
  if (!user) redirect("/portal/auth/keluar?alasan=nonaktif");
  if (!user.complete && !options.allowIncomplete) redirect("/portal/aktivasi");
  if (roles && !roles.some((role) => user.roles.includes(role))) notFound();
  if (!options.skipWorkReport && mustAttend(user.roles)) {
    const target = await pendingWorkReport(user.id);
    if (target) redirect(target);
  }
  return user;
}

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
