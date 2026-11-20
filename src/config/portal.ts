// Peta akses portal per role (docs/e2e-coverage.md bagian 1). Dipakai proxy.ts dan halaman portal.
// RLS di database tetap pengaman utama. Aturan di sini untuk pengalaman pengguna dan pesan yang jelas.

import type { AppRole } from "./roles";

export const PORTAL_PUBLIC_PATHS = [
  "/portal/login",
  "/portal/lupa-password",
  "/portal/auth/confirm",
  "/portal/auth/keluar",
] as const;

/** Halaman yang butuh sesi tetapi tidak butuh role tertentu. */
export const PORTAL_SESSION_ONLY_PATHS = [
  "/portal",
  "/portal/akses-ditolak",
  "/portal/reset-password",
  "/portal/akun",
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
  /** Label navigasi bawah di HP. */
  shortLabel: string;
}

export const PORTAL_AREAS: readonly PortalArea[] = [
  { prefix: "/portal/admin", roles: ["owner", "admin"], label: "Admin", shortLabel: "Admin" },
  {
    prefix: "/portal/owner",
    roles: ["owner", "admin"],
    label: "Dashboard owner",
    shortLabel: "Owner",
  },
  {
    prefix: "/portal/crm",
    roles: ["owner", "admin", "marketing_manager", "marketing", "finance"],
    label: "CRM",
    shortLabel: "CRM",
  },
  {
    prefix: "/portal/marketing",
    roles: ["owner", "admin", "marketing_manager", "marketing"],
    label: "Marketing",
    shortLabel: "Marketing",
  },
  {
    prefix: "/portal/lapangan",
    roles: ["owner", "admin", "site_manager", "site_supervisor"],
    label: "Laporan lapangan",
    shortLabel: "Lapangan",
  },
  {
    prefix: "/portal/absensi",
    roles: ["owner", "admin", "marketing_manager", "marketing", "site_manager", "site_supervisor"],
    label: "Absensi",
    shortLabel: "Absensi",
  },
];

/** Beranda portal setelah login, per role. */
export const ROLE_HOME: Record<AppRole, string> = {
  owner: "/portal/owner",
  admin: "/portal/admin",
  marketing_manager: "/portal/crm",
  marketing: "/portal/crm",
  site_manager: "/portal/lapangan",
  site_supervisor: "/portal/lapangan",
  finance: "/portal/crm",
};

export type PortalAccess = "public" | "allowed" | "login" | "denied";

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Menentukan akses ke path portal untuk role (null kalau belum login atau tanpa role aktif). */
export function portalAccess(
  pathname: string,
  role: AppRole | null,
  signedIn: boolean,
): PortalAccess {
  if (PORTAL_PUBLIC_PATHS.some((path) => matches(pathname, path))) return "public";
  if (!signedIn) return "login";
  // Halaman penolakan selalu bisa dibuka setelah login, supaya tidak terjadi redirect berputar.
  if (pathname === "/portal/akses-ditolak") return "allowed";
  if (!role || !ALL_STAFF.includes(role)) return "denied";
  if ((PORTAL_SESSION_ONLY_PATHS as readonly string[]).includes(pathname)) return "allowed";
  const area = PORTAL_AREAS.find((item) => matches(pathname, item.prefix));
  if (!area) return "allowed";
  return area.roles.includes(role) ? "allowed" : "denied";
}

/** Path tujuan setelah login: hanya path portal internal (cegah open redirect). */
export function safeNextPath(next: string | null | undefined, role: AppRole): string {
  if (next && /^\/portal(\/[\w\-/]*)?$/.test(next) && !next.startsWith("/portal/login")) {
    return portalAccess(next, role, true) === "allowed" ? next : ROLE_HOME[role];
  }
  return ROLE_HOME[role];
}

/** Area portal yang boleh dibuka role ini, dalam urutan navigasi. */
export function portalAreasFor(role: AppRole): readonly PortalArea[] {
  return PORTAL_AREAS.filter((area) => area.roles.includes(role));
}
