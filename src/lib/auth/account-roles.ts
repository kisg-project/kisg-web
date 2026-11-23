import "server-only";
import { isAppRole, orderRoles, type AppRole } from "@/config/roles";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface InheritedDuty {
  role: AppRole;
  positionTitle: string;
}

export interface AccountRoles {
  roles: AppRole[];
  duties: InheritedDuty[];
  profile: {
    email: string;
    fullName: string;
    phone: string | null;
    avatarPath: string | null;
    activatedAt: string | null;
    needsPassword: boolean;
  } | null;
}

export async function loadAccountRoles(
  supabase: ServerClient,
  userId: string,
): Promise<AccountRoles> {
  const [roleResult, profileResult, dutyResult] = await Promise.all([
    supabase.from("user_roles").select("role, is_primary").eq("user_id", userId),
    supabase
      .from("profiles")
      .select(
        "email, full_name, phone, avatar_path, activated_at, needs_password, is_active, deleted_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase.rpc("my_inherited_duties"),
  ]);
  const profile = profileResult.data;
  if (!profile?.is_active || profile.deleted_at) return { roles: [], duties: [], profile: null };
  const rows = roleResult.data ?? [];
  const primary = rows.find((row) => row.is_primary)?.role;
  const own = orderRoles(
    rows.map((row) => row.role).filter(isAppRole),
    primary && isAppRole(primary) ? primary : undefined,
  );
  const duties = (Array.isArray(dutyResult.data) ? dutyResult.data : [])
    .filter((duty) => isAppRole(duty.role) && !own.includes(duty.role))
    .map((duty) => ({ role: duty.role, positionTitle: duty.position_title }));
  const inherited = [...new Set(duties.map((duty) => duty.role))];
  return {
    roles: own.length > 0 ? [...own, ...inherited] : [],
    duties,
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
