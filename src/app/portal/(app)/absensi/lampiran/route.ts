import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { WORK_REPORT } from "@/config/attendance";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Foto sudah dikompres di HP ke 300 KB (profil siteReport). File kamera mentah ditolak. */
const MAX_PHOTO_BYTES = 400 * 1024;
const TYPES: Record<string, string> = { ...WORK_REPORT.photoTypes, ...WORK_REPORT.documentTypes };

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** Cek isi file sesuai tipenya: JPEG, WebP, PDF, atau Office (zip). */
function matchesContent(bytes: Uint8Array, ext: string): boolean {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ext === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (ext === "webp") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (ext === "pdf") return ascii(0, 5) === "%PDF-";
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function displayName(name: string, ext: string): string {
  const clean = name.replace(/[\\/\u0000-\u001f]/g, "").trim();
  return (clean || `Lampiran.${ext}`).slice(0, 120);
}

/**
 * Unggah lampiran laporan harian ke bucket privat work-attachments/<user>/<tanggal>/. Server
 * memeriksa ulang tipe, ukuran, dan isi file. RLS storage hanya mengizinkan karyawan yang wajib
 * absensi menulis ke foldernya sendiri.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return fail("Sesi berakhir. Silakan masuk lagi.", 401);
  if (!(await hitRateLimit("lampiran-laporan", userId, 60 * 60, 60))) {
    return fail("Terlalu banyak unggahan. Coba lagi dalam 1 jam.", 429);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Pilih file dulu.");
  const ext = TYPES[file.type];
  if (!ext) return fail("Format file tidak didukung. Pakai foto, PDF, Word, atau Excel.");
  const isPhoto = file.type in WORK_REPORT.photoTypes;
  if (file.size > (isPhoto ? MAX_PHOTO_BYTES : WORK_REPORT.maxFileBytes)) {
    return fail("Ukuran file terlalu besar. Maksimal 2 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesContent(bytes, ext)) return fail("Isi file tidak sesuai formatnya.");

  const path = `${userId}/${todayWib()}/${randomUUID()}.${ext}`;
  const upload = await supabase.storage
    .from("work-attachments")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) {
    return fail("Lampiran gagal diunggah. Coba lagi.", 403);
  }
  return NextResponse.json({
    ok: true,
    path,
    name: displayName(file.name, ext),
    type: file.type,
    size: file.size,
  });
}
