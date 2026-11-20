// Harus sama dengan enum Postgres app_role (docs/data-model.md). Dicek unit test di Fase 2.

export const APP_ROLES = [
  "owner",
  "admin",
  "marketing_manager",
  "marketing",
  "site_manager",
  "site_supervisor",
  "finance",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  marketing_manager: "Manajer marketing",
  marketing: "Marketing",
  site_manager: "Site manager",
  site_supervisor: "Pengawas lapangan",
  finance: "Keuangan",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/**
 * Role yang bisa dipilih saat mengundang atau mengubah akun. Role `admin` tidak dipakai lagi
 * (keputusan owner, 20 November 2026): fungsinya dipegang owner.
 */
export type InvitableRole = Exclude<AppRole, "admin">;

export const INVITABLE_ROLES: readonly InvitableRole[] = APP_ROLES.filter(
  (role): role is InvitableRole => role !== "admin",
);

export function isInvitableRole(role: AppRole): role is InvitableRole {
  return role !== "admin";
}

/** Role unik, berurutan sesuai APP_ROLES, dengan role utama di depan. */
export function orderRoles(roles: readonly AppRole[], primary?: AppRole): AppRole[] {
  const unique = APP_ROLES.filter((role) => roles.includes(role));
  return primary && unique.includes(primary)
    ? [primary, ...unique.filter((role) => role !== primary)]
    : unique;
}
