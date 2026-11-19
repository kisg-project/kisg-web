import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Mengakhiri sesi akun yang sudah nonaktif atau kehilangan role, lalu kembali ke halaman masuk.
 * Dipanggil dari requirePortalUser, karena Server Component tidak bisa menghapus cookie sesi.
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const target = new URL("/portal/login", request.url);
  if (request.nextUrl.searchParams.get("alasan") === "nonaktif") {
    target.searchParams.set("error", "nonaktif");
  }
  return NextResponse.redirect(target);
}
