import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cmsAccess } from "@/config/cms";
import { hasPortalRole, isAppRole, type AppRole } from "@/config/roles";
import { portalAccess, ROLE_HOME, type PortalAccess } from "@/config/portal";
import {
  CMS_PREFIX,
  PORTAL_PREFIX,
  resolveCmsRoute,
  resolvePortalRoute,
  toPublicPath,
} from "@/config/portal-host";

// Proxy untuk portal karyawan dan panel CMS: memilih host (subdomain), menyegarkan sesi Supabase, dan
// menolak rute di luar hak role. Pengaman utama tetap RLS di database dan cek role di server action.
// Akun CMS dan akun karyawan terpisah: role cms hanya untuk CMS, role lain hanya untuk portal.
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const pathname = request.nextUrl.pathname;

  const cms = resolveCmsRoute({ host, pathname, cmsHost: process.env.CMS_HOST });
  if (cms.kind !== "passthrough") {
    const early = earlyResponse(cms, request);
    if (early) return early;
    if (cms.kind !== "cms") return NextResponse.next();
    return guard(request, {
      internalPath: cms.internalPath,
      onAppHost: cms.onCmsHost,
      prefix: CMS_PREFIX,
      access: (roles, signedIn) => cmsAccess(cms.internalPath, roles, signedIn),
      loginPath: "/cms/login",
      deniedPath: "/cms/ditolak",
      home: (roles) => (roles.includes("cms") ? "/cms" : null),
    });
  }

  const portal = resolvePortalRoute({ host, pathname, portalHost: process.env.PORTAL_HOST });
  if (portal.kind === "passthrough") return NextResponse.next();
  const early = earlyResponse(portal, request);
  if (early) return early;
  if (portal.kind !== "portal") return NextResponse.next();
  return guard(request, {
    internalPath: portal.internalPath,
    onAppHost: portal.onPortalHost,
    prefix: PORTAL_PREFIX,
    access: (roles, signedIn) => portalAccess(portal.internalPath, roles, signedIn),
    loginPath: "/portal/login",
    deniedPath: "/portal/akses-ditolak",
    home: (roles) => {
      const [primary] = roles;
      return primary && hasPortalRole(roles) ? ROLE_HOME[primary] : null;
    },
  });
}

/** 404 dan pengalihan alamat lama, sebelum sesi dibaca. */
function earlyResponse(
  route: { kind: "not-found" } | { kind: "redirect"; location: string } | { kind: string },
  request: NextRequest,
): NextResponse | null {
  if (route.kind === "not-found") {
    // Path yang tidak ada: Next merender halaman 404 website dengan status 404.
    return NextResponse.rewrite(new URL("/_portal-tidak-di-sini", request.url));
  }
  if (route.kind === "redirect" && "location" in route) {
    const destination = new URL(route.location, request.url);
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  return null;
}

interface GuardOptions {
  internalPath: string;
  onAppHost: boolean;
  prefix: string;
  access: (roles: AppRole[], signedIn: boolean) => PortalAccess;
  loginPath: string;
  deniedPath: string;
  /** Beranda untuk akun yang sudah login (dari halaman login atau akar aplikasi), atau null. */
  home: (roles: AppRole[]) => string | null;
}

async function guard(request: NextRequest, options: GuardOptions): Promise<NextResponse> {
  // Preview Vercel membaca konten publik dari database production (read-only), tetapi portal dan CMS
  // dimatikan supaya kode yang belum di-merge tidak bisa mengubah data production.
  if (process.env.VERCEL_ENV === "preview") {
    return new NextResponse("Aplikasi tidak aktif di preview.", { status: 503 });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return new NextResponse("Aplikasi belum dikonfigurasi untuk lingkungan ini.", { status: 503 });
  }

  const { internalPath, onAppHost, prefix } = options;
  const rewriteUrl = new URL(internalPath, request.url);
  rewriteUrl.search = request.nextUrl.search;
  const pass = () =>
    onAppHost ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request });

  let response = pass();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = pass();
        for (const { name, value, options: cookieOptions } of cookiesToSet) {
          response.cookies.set(name, value, cookieOptions);
        }
        // Header cache dari Supabase mencegah CDN menyimpan response yang berisi sesi.
        for (const [header, value] of Object.entries(headers)) response.headers.set(header, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = claimRoles(claims);
  const access = options.access(roles, Boolean(claims));

  const redirectTo = (internalTarget: string, params?: Record<string, string>) => {
    const destination = new URL(toPublicPath(internalTarget, onAppHost, prefix), request.url);
    for (const [name, value] of Object.entries(params ?? {}))
      destination.searchParams.set(name, value);
    const redirect = NextResponse.redirect(destination);
    // Bawa cookie sesi yang baru disegarkan ke response redirect.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  };

  if (access === "login") return redirectTo(options.loginPath, { next: internalPath });
  if (access === "denied") return redirectTo(options.deniedPath);
  if (internalPath === options.loginPath || internalPath === prefix) {
    const home = options.home(roles);
    if (home && home !== internalPath) return redirectTo(home);
  }
  return response;
}

/**
 * Role dari JWT: app_roles (multi role, role utama di depan). Token lama hanya punya app_role.
 * Kosong kalau akun nonaktif.
 */
function claimRoles(claims: Record<string, unknown> | undefined): AppRole[] {
  if (!claims || claims.is_active !== true) return [];
  const list = Array.isArray(claims.app_roles) ? claims.app_roles : [claims.app_role];
  return list.filter(isAppRole);
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/cms/:path*",
    // Host portal (PORTAL_HOST berawalan "company.") dan host CMS (CMS_HOST berawalan "cms."):
    // semua path kecuali aset statis.
    {
      source:
        "/((?!_next/static|_next/image|images/|brand/|vendor/|favicon.ico|robots.txt|sitemap.xml).*)",
      has: [{ type: "host", value: "company\\..*" }],
    },
    {
      source:
        "/((?!_next/static|_next/image|images/|brand/|vendor/|favicon.ico|robots.txt|sitemap.xml).*)",
      has: [{ type: "host", value: "cms\\..*" }],
    },
  ],
};
