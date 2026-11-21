// Harus sama dengan enum Postgres app_role (docs/data-model.md). Dicek unit test di Fase 2.

export const APP_ROLES = [
  "owner",
  "admin",
  "marketing_manager",
  "marketing",
  "site_manager",
  "site_supervisor",
  "finance",
  // Akun khusus panel CMS (cms.kisgroup.co.id). Tidak bisa masuk portal dan tidak bisa digabung
  // dengan role lain (keputusan owner, 21 November 2026).
  "cms",
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
  cms: "Pengelola CMS",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/**
 * Role yang bisa dipilih saat mengundang atau mengubah akun karyawan. Role `admin` tidak dipakai lagi
 * (keputusan owner, 20 November 2026). Akun `cms` dibuat terpisah, bukan lewat undangan karyawan.
 */
export type InvitableRole = Exclude<AppRole, "admin" | "cms">;

export const INVITABLE_ROLES: readonly InvitableRole[] = APP_ROLES.filter(
  (role): role is InvitableRole => role !== "admin" && role !== "cms",
);

export function isInvitableRole(role: AppRole): role is InvitableRole {
  return role !== "admin" && role !== "cms";
}

/** Role karyawan yang boleh memakai portal (semua kecuali akun khusus CMS). */
export const PORTAL_ROLES = APP_ROLES.filter((role) => role !== "cms");

export function hasPortalRole(roles: readonly AppRole[]): boolean {
  return roles.some((role) => role !== "cms");
}

/** Role unik, berurutan sesuai APP_ROLES, dengan role utama di depan. */
export function orderRoles(roles: readonly AppRole[], primary?: AppRole): AppRole[] {
  const unique = APP_ROLES.filter((role) => roles.includes(role));
  return primary && unique.includes(primary)
    ? [primary, ...unique.filter((role) => role !== primary)]
    : unique;
}
