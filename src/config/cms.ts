// Peta akses panel CMS (cms.kisgroup.co.id). Hanya akun dengan role cms. Owner dan karyawan memakai
// portal, bukan CMS (keputusan owner, 21 November 2026). RLS tetap pengaman utama.

import type { PortalAccess } from "./portal";
import type { AppRole } from "./roles";

export const CMS_PUBLIC_PATHS = ["/cms/login", "/cms/auth/keluar", "/cms/ditolak"] as const;

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function cmsAccess(
  pathname: string,
  roles: readonly AppRole[],
  signedIn: boolean,
): PortalAccess {
  if (CMS_PUBLIC_PATHS.some((path) => matches(pathname, path))) return "public";
  if (!signedIn) return "login";
  return roles.includes("cms") ? "allowed" : "denied";
}

/** Menu panel CMS, dalam urutan navigasi. Modul lain (banner, promo, proyek, FAQ) menyusul. */
export const CMS_NAV = [
  { href: "/cms", label: "Ringkasan" },
  { href: "/cms/berita", label: "Berita" },
  { href: "/cms/lowongan", label: "Lowongan" },
] as const;
