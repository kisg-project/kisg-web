import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAppRole } from "@/config/roles";
import { portalAccess, ROLE_HOME } from "@/config/portal";

// Proxy hanya untuk portal: menyegarkan sesi Supabase dan menolak rute di luar hak role.
// Pengaman utama tetap RLS di database dan cek role di server action.
export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return new NextResponse("Portal belum dikonfigurasi untuk lingkungan ini.", { status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
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
  const role =
    claims && isAppRole(claims.app_role) && claims.is_active === true ? claims.app_role : null;
  const { pathname } = request.nextUrl;
  const access = portalAccess(pathname, role, Boolean(claims));

  const redirectTo = (target: string, params?: Record<string, string>) => {
    const destination = new URL(target, request.url);
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

  if (access === "login") return redirectTo("/portal/login", { next: pathname });
  if (access === "denied") return redirectTo("/portal/akses-ditolak");
  if ((pathname === "/portal/login" || pathname === "/portal") && role) {
    return redirectTo(ROLE_HOME[role]);
  }
  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};
