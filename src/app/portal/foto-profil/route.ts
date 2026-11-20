import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { avatarUrl } from "@/features/users";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Batas keras sama dengan bucket avatars (262144 byte). Browser sudah mengompres ke sekitar 100 KB. */
const MAX_BYTES = 256 * 1024;
const TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" } as const;

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** Cek isi file sesuai tipenya (server tidak percaya tipe dari browser). */
function looksLikeImage(bytes: Uint8Array, type: keyof typeof TYPES): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (type === "image/png") return bytes[0] === 0x89 && ascii(1, 4) === "PNG";
  return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

function isAllowedType(type: string): type is keyof typeof TYPES {
  return type in TYPES;
}

/**
 * Unggah foto profil sendiri (aktivasi dan Akun saya). Route handler karena menerima file.
 * Disimpan di bucket privat avatars/<user_id>/, foto lama dihapus, lalu profiles.avatar_path diganti.
 * RLS storage memastikan pengguna hanya menulis ke foldernya sendiri.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return fail("Sesi berakhir. Silakan masuk lagi.", 401);
  if (!(await hitRateLimit("foto-profil", userId, 60 * 60, 20))) {
    return fail("Terlalu sering mengganti foto. Coba lagi dalam 1 jam.", 429);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("foto");
  if (!(file instanceof File) || file.size === 0) return fail("Ambil atau pilih foto profil dulu.");
  if (!isAllowedType(file.type)) return fail("Format foto harus JPG, PNG, atau WebP.");
  if (file.size > MAX_BYTES) return fail("Ukuran foto terlalu besar. Coba ambil ulang fotonya.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeImage(bytes, file.type)) return fail("File bukan foto yang valid.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .maybeSingle();
  const path = `${userId}/${randomUUID()}.${TYPES[file.type]}`;
  const upload = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) return fail("Foto gagal diunggah. Coba lagi.", 500);

  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
  if (error) {
    await supabase.storage.from("avatars").remove([path]);
    return fail("Foto gagal disimpan. Coba lagi.", 500);
  }
  if (profile?.avatar_path && profile.avatar_path !== path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }
  return NextResponse.json({ ok: true, path, url: await avatarUrl(path) });
}
