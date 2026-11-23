import type { AppRole } from "./roles";

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
  "/portal/reset-password",
  "/portal/akun",
  "/portal/aktivasi",
  "/portal/foto-profil",
] as const;

const ALL_STAFF: readonly AppRole[] = [
  "owner",
  "admin",
  "marketing_manager",
  "marketing",
  "site_manager",
  "site_supervisor",
  "finance",
];

export interface PortalArea {
  prefix: string;
  roles: readonly AppRole[];
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
    roles: ["owner", "admin", "marketing_manager", "marketing", "finance"],
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
    roles: [
      "admin",
      "marketing_manager",
      "marketing",
      "site_manager",
      "site_supervisor",
      "finance",
    ],
    label: "Absensi",
    shortLabel: "Absensi",
  },
];

export const ROLE_HOME: Record<AppRole, string> = {
  owner: "/portal/owner",
  admin: "/portal/admin",
  marketing_manager: "/portal/crm",
  marketing: "/portal/crm",
  site_manager: "/portal/lapangan",
  site_supervisor: "/portal/lapangan",
  finance: "/portal/crm",
  cms: "/portal/akses-ditolak",
};

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
  return area.roles.some((role) => roles.includes(role)) ? "allowed" : "denied";
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
  return PORTAL_AREAS.filter((area) => area.roles.some((role) => roles.includes(role)));
}
