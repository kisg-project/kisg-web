import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { loadAccountRoles } from "@/lib/auth/account-roles";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Batas keras gambar konten website (browser mengompres ke 500 KB, CLAUDE.md bagian 8). */
const MAX_BYTES = 600 * 1024;
const TYPES = { "image/webp": "webp", "image/jpeg": "jpg" } as const;
const FOLDERS = ["berita", "lowongan"] as const;

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function looksLikeImage(bytes: Uint8Array, type: keyof typeof TYPES): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

function isAllowedType(type: string): type is keyof typeof TYPES {
  return type in TYPES;
}

/**
 * Unggah gambar konten dari panel CMS ke bucket publik public-assets/<folder>/. Hanya akun CMS.
 * Gambar sudah dikompres di browser. Server tetap memeriksa tipe, ukuran, dan isi file.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return fail("Sesi berakhir. Silakan masuk lagi.", 401);
  const { roles } = await loadAccountRoles(supabase, userId);
  if (!roles.includes("cms")) return fail("Akun ini tidak punya akses ke panel CMS.", 403);
  if (!(await hitRateLimit("cms-aset", userId, 60 * 60, 120))) {
    return fail("Terlalu banyak unggahan. Coba lagi dalam 1 jam.", 429);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("gambar");
  const folder = form?.get("folder");
  if (typeof folder !== "string" || !(FOLDERS as readonly string[]).includes(folder)) {
    return fail("Folder unggahan tidak dikenal.");
  }
  if (!(file instanceof File) || file.size === 0) return fail("Pilih gambar dulu.");
  if (!isAllowedType(file.type)) return fail("Format gambar harus WebP atau JPG.");
  if (file.size > MAX_BYTES) return fail("Ukuran gambar terlalu besar. Pilih gambar lain.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeImage(bytes, file.type)) return fail("File bukan gambar yang valid.");

  const path = `${folder}/${randomUUID()}.${TYPES[file.type]}`;
  const upload = await supabase.storage
    .from("public-assets")
    .upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (upload.error) return fail("Gambar gagal diunggah. Coba lagi.", 500);
  const { data: url } = supabase.storage.from("public-assets").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: url.publicUrl });
}
