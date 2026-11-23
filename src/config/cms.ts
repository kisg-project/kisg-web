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
