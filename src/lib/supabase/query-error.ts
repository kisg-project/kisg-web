// Kode error PostgREST/Postgres untuk tabel, kolom, atau relasi yang belum ada di schema.
const MISSING_SCHEMA_CODES = new Set(["PGRST200", "PGRST204", "PGRST205", "42P01", "42703"]);

interface QueryError {
  code?: string;
  message: string;
}

/**
 * Error query konten publik. Di Preview Vercel, database yang dibaca adalah production, yang belum
 * punya migrasi dari PR itu. Khusus kasus itu konten ditampilkan kosong (dengan peringatan di log)
 * supaya preview tetap bisa dicek. Di production, CI, dan lokal, error selalu dilempar.
 */
export function handleContentError<T>(what: string, error: QueryError, fallback: T): T {
  const isPreview = process.env.VERCEL_ENV === "preview";
  if (isPreview && error.code && MISSING_SCHEMA_CODES.has(error.code)) {
    console.warn(`Preview: ${what} kosong karena migrasi PR ini belum ada di production (${error.code}).`);
    return fallback;
  }
  throw new Error(`Gagal memuat ${what}: ${error.message}`);
}
