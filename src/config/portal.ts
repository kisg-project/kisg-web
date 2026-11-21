// Peta akses portal per role (docs/e2e-coverage.md bagian 1). Dipakai proxy.ts dan halaman portal.
// RLS di database tetap pengaman utama. Aturan di sini untuk pengalaman pengguna dan pesan yang jelas.

import type { AppRole } from "./roles";

export const PORTAL_PUBLIC_PATHS = [
  "/portal/login",
  "/portal/lupa-password",
  "/portal/auth/confirm",
  "/portal/auth/keluar",
  // PWA: manifest, service worker, dan halaman offline harus bisa dimuat sebelum login.
  "/portal/manifest.webmanifest",
  "/portal/sw.js",
  "/portal/offline",
] as const;

/** Halaman yang butuh sesi tetapi tidak butuh role tertentu. */
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
  /** Label navigasi bawah di HP. */
  shortLabel: string;
}

export const PORTAL_AREAS: readonly PortalArea[] = [
  // Area akun admin lama (role admin tidak dipakai lagi). Owner memakai area owner.
  { prefix: "/portal/admin", roles: ["admin"], label: "Admin", shortLabel: "Admin" },
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
    // Semua karyawan yang wajib absen (owner tidak wajib, memantau dari dashboard owner).
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

/** Beranda portal setelah login, per role. */
export const ROLE_HOME: Record<AppRole, string> = {
  owner: "/portal/owner",
  admin: "/portal/admin",
  marketing_manager: "/portal/crm",
  marketing: "/portal/crm",
  site_manager: "/portal/lapangan",
  site_supervisor: "/portal/lapangan",
  finance: "/portal/crm",
  // Akun CMS tidak memakai portal (ditolak di login dan proxy).
  cms: "/portal/akses-ditolak",
};

export type PortalAccess = "public" | "allowed" | "login" | "denied";

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Menentukan akses ke path portal. `roles` berisi semua role akun (multi role, hak akses gabungan),
 * kosong kalau belum login atau akun tanpa role aktif.
 */
export function portalAccess(
  pathname: string,
  roles: readonly AppRole[],
  signedIn: boolean,
): PortalAccess {
  if (PORTAL_PUBLIC_PATHS.some((path) => matches(pathname, path))) return "public";
  if (!signedIn) return "login";
  // Halaman penolakan selalu bisa dibuka setelah login, supaya tidak terjadi redirect berputar.
  if (pathname === "/portal/akses-ditolak") return "allowed";
  if (!roles.some((role) => ALL_STAFF.includes(role))) return "denied";
  if ((PORTAL_SESSION_ONLY_PATHS as readonly string[]).includes(pathname)) return "allowed";
  const area = PORTAL_AREAS.find((item) => matches(pathname, item.prefix));
  if (!area) return "allowed";
  return area.roles.some((role) => roles.includes(role)) ? "allowed" : "denied";
}

/**
 * Path tujuan setelah login: hanya path portal internal (cegah open redirect). Beranda mengikuti
 * role utama (elemen pertama `roles`).
 */
export function safeNextPath(next: string | null | undefined, roles: readonly AppRole[]): string {
  const [primary] = roles;
  const home = primary ? ROLE_HOME[primary] : "/portal/akses-ditolak";
  if (next && /^\/portal(\/[\w\-/]*)?$/.test(next) && !next.startsWith("/portal/login")) {
    return portalAccess(next, roles, true) === "allowed" ? next : home;
  }
  return home;
}

/** Area portal yang boleh dibuka akun dengan role-role ini (gabungan), dalam urutan navigasi. */
export function portalAreasFor(roles: readonly AppRole[]): readonly PortalArea[] {
  return PORTAL_AREAS.filter((area) => area.roles.some((role) => roles.includes(role)));
}
