import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAppRole, type AppRole } from "@/config/roles";
import { portalAccess, ROLE_HOME } from "@/config/portal";
import { resolvePortalRoute, toPublicPath } from "@/config/portal-host";

// Proxy untuk portal: memilih host (subdomain portal), menyegarkan sesi Supabase, dan menolak rute di
// luar hak role. Pengaman utama tetap RLS di database dan cek role di server action.
export async function proxy(request: NextRequest) {
  const route = resolvePortalRoute({
    host: request.headers.get("host") ?? request.nextUrl.host,
    pathname: request.nextUrl.pathname,
    portalHost: process.env.PORTAL_HOST,
  });
  if (route.kind === "passthrough") return NextResponse.next();
  if (route.kind === "not-found") {
    // Path yang tidak ada: Next merender halaman 404 website dengan status 404.
    return NextResponse.rewrite(new URL("/_portal-tidak-di-sini", request.url));
  }
  if (route.kind === "redirect") {
    const destination = new URL(route.location, request.url);
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }

  // Preview Vercel membaca konten publik dari database production (read-only), tetapi portal dimatikan
  // supaya kode yang belum di-merge tidak bisa mengubah data production.
  if (process.env.VERCEL_ENV === "preview") {
    return new NextResponse("Portal tidak aktif di preview.", { status: 503 });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return new NextResponse("Portal belum dikonfigurasi untuk lingkungan ini.", { status: 503 });
  }

  const { internalPath, onPortalHost } = route;
  const rewriteUrl = new URL(internalPath, request.url);
  rewriteUrl.search = request.nextUrl.search;
  const pass = () =>
    onPortalHost ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request });

  let response = pass();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = pass();
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Header cache dari Supabase mencegah CDN menyimpan response yang berisi sesi.
        for (const [header, value] of Object.entries(headers)) response.headers.set(header, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const roles = claimRoles(claims);
  const [role] = roles;
  const access = portalAccess(internalPath, roles, Boolean(claims));

  const redirectTo = (internalTarget: string, params?: Record<string, string>) => {
    const destination = new URL(toPublicPath(internalTarget, onPortalHost), request.url);
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

  if (access === "login") return redirectTo("/portal/login", { next: internalPath });
  if (access === "denied") return redirectTo("/portal/akses-ditolak");
  if ((internalPath === "/portal/login" || internalPath === "/portal") && role) {
    return redirectTo(ROLE_HOME[role]);
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
    // Host portal (PORTAL_HOST harus berawalan "company."): semua path kecuali aset statis.
    {
      source: "/((?!_next/static|_next/image|images/|brand/|favicon.ico|robots.txt|sitemap.xml).*)",
      has: [{ type: "host", value: "company\\..*" }],
    },
  ],
};
