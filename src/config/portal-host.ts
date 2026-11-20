// Portal karyawan di subdomain sendiri (keputusan owner, 20 November 2026): company.kisgroup.co.id.
// Route aplikasi tetap di src/app/portal/. Di host portal, path bersih (/login, /crm) di-rewrite ke
// /portal/..., dan /portal di host lain (website) menjadi 404. Aktif hanya kalau PORTAL_HOST diisi;
// sebelum itu portal tetap di /portal pada domain mana pun (masa transisi sebelum DNS siap).

export const PORTAL_PREFIX = "/portal";

export type PortalRoute =
  /** Bukan urusan portal (halaman website di host utama). */
  | { kind: "passthrough" }
  /** /portal di host website setelah portal pindah ke subdomain. */
  | { kind: "not-found" }
  /** Alamat lama /portal/... di host portal dialihkan ke alamat bersih. */
  | { kind: "redirect"; location: string }
  /** Halaman portal. internalPath selalu berawalan /portal. */
  | { kind: "portal"; internalPath: string; onPortalHost: boolean };

function hostname(value: string): string {
  return value.split(":")[0]?.toLowerCase() ?? "";
}

function isPortalPath(pathname: string): boolean {
  return pathname === PORTAL_PREFIX || pathname.startsWith(`${PORTAL_PREFIX}/`);
}

export function resolvePortalRoute(input: {
  host: string;
  pathname: string;
  portalHost: string | undefined;
}): PortalRoute {
  const { pathname } = input;
  const portalHost = input.portalHost ? hostname(input.portalHost) : "";
  if (!portalHost) {
    return isPortalPath(pathname)
      ? { kind: "portal", internalPath: pathname, onPortalHost: false }
      : { kind: "passthrough" };
  }
  if (hostname(input.host) !== portalHost) {
    return isPortalPath(pathname) ? { kind: "not-found" } : { kind: "passthrough" };
  }
  if (isPortalPath(pathname)) {
    return { kind: "redirect", location: toPublicPath(pathname, true) };
  }
  return {
    kind: "portal",
    internalPath: pathname === "/" ? PORTAL_PREFIX : `${PORTAL_PREFIX}${pathname}`,
    onPortalHost: true,
  };
}

/** Path yang dilihat pengguna: tanpa awalan /portal di host portal. */
export function toPublicPath(internalPath: string, onPortalHost: boolean): string {
  if (!onPortalHost || !isPortalPath(internalPath)) return internalPath;
  const rest = internalPath.slice(PORTAL_PREFIX.length);
  return rest === "" ? "/" : rest;
}
