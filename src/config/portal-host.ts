// Aplikasi di subdomain sendiri (keputusan owner, 20 dan 21 November 2026):
// - portal karyawan: company.kisgroup.co.id, route src/app/portal/ (env PORTAL_HOST)
// - panel CMS: cms.kisgroup.co.id, route src/app/cms/ (env CMS_HOST)
// Di host aplikasi, path bersih (/login, /crm) di-rewrite ke /<prefix>/..., dan /<prefix> di host lain
// menjadi 404. Aktif hanya kalau env host diisi; sebelum itu aplikasi tetap di /<prefix> pada domain
// mana pun (masa transisi sebelum DNS siap).

export const PORTAL_PREFIX = "/portal";
export const CMS_PREFIX = "/cms";

type HostedRoute =
  /** Bukan urusan aplikasi ini. */
  | { kind: "passthrough" }
  /** /<prefix> di host lain setelah aplikasi pindah ke subdomain. */
  | { kind: "not-found" }
  /** Alamat lama /<prefix>/... di host aplikasi dialihkan ke alamat bersih. */
  | { kind: "redirect"; location: string }
  /** Halaman aplikasi. internalPath selalu berawalan prefix. */
  | { kind: "app"; internalPath: string; onAppHost: boolean };

export type PortalRoute =
  | { kind: "passthrough" }
  | { kind: "not-found" }
  | { kind: "redirect"; location: string }
  /** Halaman portal. internalPath selalu berawalan /portal. */
  | { kind: "portal"; internalPath: string; onPortalHost: boolean };

export type CmsRoute =
  | { kind: "passthrough" }
  | { kind: "not-found" }
  | { kind: "redirect"; location: string }
  /** Halaman CMS. internalPath selalu berawalan /cms. */
  | { kind: "cms"; internalPath: string; onCmsHost: boolean };

function hostname(value: string): string {
  return value.split(":")[0]?.toLowerCase() ?? "";
}

function isAppPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function resolveHosted(
  prefix: string,
  input: { host: string; pathname: string; appHost: string | undefined },
): HostedRoute {
  const { pathname } = input;
  const appHost = input.appHost ? hostname(input.appHost) : "";
  if (!appHost) {
    return isAppPath(pathname, prefix)
      ? { kind: "app", internalPath: pathname, onAppHost: false }
      : { kind: "passthrough" };
  }
  if (hostname(input.host) !== appHost) {
    return isAppPath(pathname, prefix) ? { kind: "not-found" } : { kind: "passthrough" };
  }
  if (isAppPath(pathname, prefix)) {
    return { kind: "redirect", location: toPublicPath(pathname, true, prefix) };
  }
  return {
    kind: "app",
    internalPath: pathname === "/" ? prefix : `${prefix}${pathname}`,
    onAppHost: true,
  };
}

export function resolvePortalRoute(input: {
  host: string;
  pathname: string;
  portalHost: string | undefined;
}): PortalRoute {
  const route = resolveHosted(PORTAL_PREFIX, { ...input, appHost: input.portalHost });
  return route.kind === "app"
    ? { kind: "portal", internalPath: route.internalPath, onPortalHost: route.onAppHost }
    : route;
}

export function resolveCmsRoute(input: {
  host: string;
  pathname: string;
  cmsHost: string | undefined;
}): CmsRoute {
  const route = resolveHosted(CMS_PREFIX, { ...input, appHost: input.cmsHost });
  return route.kind === "app"
    ? { kind: "cms", internalPath: route.internalPath, onCmsHost: route.onAppHost }
    : route;
}

/** Path yang dilihat pengguna: tanpa awalan prefix di host aplikasi itu. */
export function toPublicPath(
  internalPath: string,
  onAppHost: boolean,
  prefix: string = PORTAL_PREFIX,
): string {
  if (!onAppHost || !isAppPath(internalPath, prefix)) return internalPath;
  const rest = internalPath.slice(prefix.length);
  return rest === "" ? "/" : rest;
}
