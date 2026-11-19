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
