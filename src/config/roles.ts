export const APP_ROLES = [
  "owner",
  "admin",
  "marketing_manager",
  "marketing",
  "site_manager",
  "site_supervisor",
  "finance",
  "cms",
  "direktur",
  "general_manager",
  "marketing_supervisor",
  "marketing_admin",
  "kpr_officer",
  "finance_manager",
  "cashier",
  "collection_staff",
  "tax_staff",
  "purchasing_staff",
  "warehouse_staff",
  "project_manager",
  "quantity_surveyor",
  "drafter",
  "qc_staff",
  "legal_manager",
  "legal_staff",
  "hr_manager",
  "hr_staff",
  "ga_staff",
  "customer_service",
  "estate_manager",
  "auditor",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Direktur Utama",
  admin: "Admin sistem",
  marketing_manager: "Manajer marketing",
  marketing: "Marketing",
  site_manager: "Site manager",
  site_supervisor: "Pengawas lapangan",
  finance: "Keuangan",
  cms: "Pengelola CMS",
  direktur: "Direktur",
  general_manager: "General manager",
  marketing_supervisor: "Supervisor marketing",
  marketing_admin: "Admin marketing",
  kpr_officer: "KPR officer",
  finance_manager: "Manajer keuangan",
  cashier: "Kasir",
  collection_staff: "Staf penagihan",
  tax_staff: "Staf pajak",
  purchasing_staff: "Staf pembelian",
  warehouse_staff: "Staf gudang",
  project_manager: "Manajer proyek",
  quantity_surveyor: "Quantity surveyor",
  drafter: "Drafter atau arsitek",
  qc_staff: "Staf QC",
  legal_manager: "Manajer legal",
  legal_staff: "Staf legal dan perizinan",
  hr_manager: "Manajer HR",
  hr_staff: "Staf HR",
  ga_staff: "Staf GA",
  customer_service: "Customer service",
  estate_manager: "Estate manager",
  auditor: "Auditor internal",
};

export const ROLE_GROUPS: readonly { label: string; roles: readonly AppRole[] }[] = [
  { label: "Direksi", roles: ["owner", "direktur", "general_manager"] },
  {
    label: "Marketing dan penjualan",
    roles: [
      "marketing_manager",
      "marketing_supervisor",
      "marketing",
      "marketing_admin",
      "kpr_officer",
    ],
  },
  {
    label: "Keuangan dan akuntansi",
    roles: ["finance_manager", "finance", "cashier", "collection_staff", "tax_staff"],
  },
  { label: "Pembelian dan gudang", roles: ["purchasing_staff", "warehouse_staff"] },
  {
    label: "Teknik dan konstruksi",
    roles: [
      "project_manager",
      "site_manager",
      "site_supervisor",
      "quantity_surveyor",
      "drafter",
      "qc_staff",
    ],
  },
  { label: "Legal dan perizinan", roles: ["legal_manager", "legal_staff"] },
  { label: "HR dan umum", roles: ["hr_manager", "hr_staff", "ga_staff"] },
  { label: "Layanan konsumen dan estate", roles: ["customer_service", "estate_manager"] },
  { label: "Sistem", roles: ["auditor"] },
];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export type InvitableRole = Exclude<AppRole, "admin" | "cms">;

export const INVITABLE_ROLES: readonly InvitableRole[] = APP_ROLES.filter(
  (role): role is InvitableRole => role !== "admin" && role !== "cms",
);

export function isInvitableRole(role: AppRole): role is InvitableRole {
  return role !== "admin" && role !== "cms";
}

export const PORTAL_ROLES = APP_ROLES.filter((role) => role !== "cms");

export const STAFF_ROLES = APP_ROLES.filter((role) => role !== "cms" && role !== "owner");

export function hasPortalRole(roles: readonly AppRole[]): boolean {
  return roles.some((role) => role !== "cms");
}

export function orderRoles(roles: readonly AppRole[], primary?: AppRole): AppRole[] {
  const unique = APP_ROLES.filter((role) => roles.includes(role));
  return primary && unique.includes(primary)
    ? [primary, ...unique.filter((role) => role !== primary)]
    : unique;
}
