import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Batas keras sama dengan bucket attendance-photos (200 KB). Browser mengompres ke 150 KB. */
const MAX_BYTES = 200 * 1024;
const TYPES = { "image/webp": "webp", "image/jpeg": "jpg" } as const;

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

/** Tanggal kerja WIB (folder foto), sama dengan private.today_wib() di database. */
function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/**
 * Unggah selfie absensi ke bucket privat attendance-photos/<user>/<tanggal>/. Foto sudah lolos cek
 * wajah dan kedip di HP, lalu dikompres. Server memeriksa ulang tipe, ukuran, dan isi file; RLS
 * storage hanya mengizinkan karyawan yang wajib absen menulis ke foldernya sendiri.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return fail("Sesi berakhir. Silakan masuk lagi.", 401);
  if (!(await hitRateLimit("selfie-absensi", userId, 60 * 60, 30))) {
    return fail("Terlalu banyak percobaan foto. Coba lagi dalam 1 jam.", 429);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("foto");
  const kind = form?.get("jenis");
  if (kind !== "masuk" && kind !== "pulang") return fail("Jenis absen tidak dikenal.");
  if (!(file instanceof File) || file.size === 0) return fail("Ambil foto dulu.");
  if (!isAllowedType(file.type)) return fail("Format foto tidak didukung.");
  if (file.size > MAX_BYTES) return fail("Ukuran foto terlalu besar. Coba ambil ulang.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikeImage(bytes, file.type)) return fail("File bukan foto yang valid.");

  const path = `${userId}/${todayWib()}/${kind}-${randomUUID()}.${TYPES[file.type]}`;
  const upload = await supabase.storage
    .from("attendance-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) {
    return fail("Foto gagal diunggah. Pastikan akun Anda wajib absensi, lalu coba lagi.", 403);
  }
  return NextResponse.json({ ok: true, path });
}
