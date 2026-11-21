import type { NextRequest } from "next/server";
import { isOgPagePath, OG_PAGES } from "@/lib/seo/page-metadata";
import { renderOgImage } from "@/lib/seo/og-image";

/**
 * Gambar share bermerek (1200x630) untuk halaman website: /og?p=/simulasi-kpr. Hanya path yang
 * terdaftar di OG_PAGES, supaya tidak bisa dipakai membuat gambar berisi teks bebas.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("p") ?? "/";
  if (!isOgPagePath(path)) return new Response("Tidak ditemukan", { status: 404 });
  return renderOgImage(OG_PAGES[path]);
}
