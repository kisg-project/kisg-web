import type { NextRequest } from "next/server";
import { relativeRedirect } from "@/lib/http/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutTo(path: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // 303: setelah POST, browser membuka halaman masuk dengan GET.
  return relativeRedirect(path, 303);
}

/** Tombol Keluar di portal (form POST). */
export async function POST() {
  return signOutTo("/portal/login");
}

/**
 * Akun yang sudah nonaktif atau kehilangan role. Dipanggil dari requirePortalUser, karena Server
 * Component tidak bisa menghapus cookie sesi sendiri.
 */
export async function GET(request: NextRequest) {
  const nonaktif = request.nextUrl.searchParams.get("alasan") === "nonaktif";
  return signOutTo(nonaktif ? "/portal/login?error=nonaktif" : "/portal/login");
}
