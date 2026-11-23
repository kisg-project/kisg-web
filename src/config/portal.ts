import { STAFF_ROLES, type AppRole } from "./roles";

export const PORTAL_PUBLIC_PATHS = [
  "/portal/login",
  "/portal/lupa-password",
  "/portal/auth/confirm",
  "/portal/auth/keluar",
  "/portal/manifest.webmanifest",
  "/portal/sw.js",
  "/portal/offline",
] as const;

export const PORTAL_SESSION_ONLY_PATHS = [
  "/portal",
  "/portal/akses-ditolak",
  "/portal/beranda",
  "/portal/reset-password",
  "/portal/akun",
  "/portal/aktivasi",
  "/portal/foto-profil",
] as const;

const ALL_STAFF: readonly AppRole[] = ["owner", ...STAFF_ROLES];

export interface PortalArea {
  prefix: string;
  roles: readonly AppRole[];
  excludes?: readonly AppRole[];
  label: string;
  shortLabel: string;
}

export const PORTAL_AREAS: readonly PortalArea[] = [
  { prefix: "/portal/admin", roles: ["admin"], label: "Admin", shortLabel: "Admin" },
  {
    prefix: "/portal/owner",
    roles: ["owner", "admin"],
    label: "Dashboard direktur utama",
    shortLabel: "Direktur",
  },
  {
    prefix: "/portal/crm",
    roles: [
      "owner",
      "admin",
      "direktur",
      "general_manager",
      "marketing_manager",
      "marketing_supervisor",
      "marketing",
      "marketing_admin",
      "kpr_officer",
      "finance",
    ],
    label: "CRM",
    shortLabel: "CRM",
  },
  {
    prefix: "/portal/lapangan",
    roles: ["site_manager", "site_supervisor"],
    label: "Laporan lapangan",
    shortLabel: "Lapangan",
  },
  {
    prefix: "/portal/absensi",
    roles: STAFF_ROLES,
    excludes: ["owner"],
    label: "Absensi",
    shortLabel: "Absensi",
  },
];

const SALES_HOME = "/portal/crm";
const GENERAL_HOME = "/portal/beranda";

export const ROLE_HOME: Record<AppRole, string> = {
  owner: "/portal/owner",
  admin: "/portal/admin",
  marketing_manager: SALES_HOME,
  marketing: SALES_HOME,
  site_manager: "/portal/lapangan",
  site_supervisor: "/portal/lapangan",
  finance: SALES_HOME,
  cms: "/portal/akses-ditolak",
  direktur: GENERAL_HOME,
  general_manager: GENERAL_HOME,
  marketing_supervisor: SALES_HOME,
  marketing_admin: SALES_HOME,
  kpr_officer: SALES_HOME,
  finance_manager: GENERAL_HOME,
  cashier: GENERAL_HOME,
  collection_staff: GENERAL_HOME,
  tax_staff: GENERAL_HOME,
  purchasing_staff: GENERAL_HOME,
  warehouse_staff: GENERAL_HOME,
  project_manager: GENERAL_HOME,
  quantity_surveyor: GENERAL_HOME,
  drafter: GENERAL_HOME,
  qc_staff: GENERAL_HOME,
  legal_manager: GENERAL_HOME,
  legal_staff: GENERAL_HOME,
  hr_manager: GENERAL_HOME,
  hr_staff: GENERAL_HOME,
  ga_staff: GENERAL_HOME,
  customer_service: GENERAL_HOME,
  estate_manager: GENERAL_HOME,
  auditor: GENERAL_HOME,
};

export function areaAllows(area: PortalArea, roles: readonly AppRole[]): boolean {
  return (
    area.roles.some((role) => roles.includes(role)) &&
    !(area.excludes ?? []).some((role) => roles.includes(role))
  );
}

export type PortalAccess = "public" | "allowed" | "login" | "denied";

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function portalAccess(
  pathname: string,
  roles: readonly AppRole[],
  signedIn: boolean,
): PortalAccess {
  if (PORTAL_PUBLIC_PATHS.some((path) => matches(pathname, path))) return "public";
  if (!signedIn) return "login";
  if (pathname === "/portal/akses-ditolak") return "allowed";
  if (!roles.some((role) => ALL_STAFF.includes(role))) return "denied";
  if ((PORTAL_SESSION_ONLY_PATHS as readonly string[]).includes(pathname)) return "allowed";
  const area = PORTAL_AREAS.find((item) => matches(pathname, item.prefix));
  if (!area) return "allowed";
  return areaAllows(area, roles) ? "allowed" : "denied";
}

export function safeNextPath(next: string | null | undefined, roles: readonly AppRole[]): string {
  const [primary] = roles;
  const home = primary ? ROLE_HOME[primary] : "/portal/akses-ditolak";
  if (next && /^\/portal(\/[\w\-/]*)?$/.test(next) && !next.startsWith("/portal/login")) {
    return portalAccess(next, roles, true) === "allowed" ? next : home;
  }
  return home;
}

export function portalAreasFor(roles: readonly AppRole[]): readonly PortalArea[] {
  return PORTAL_AREAS.filter((area) => areaAllows(area, roles));
}
