/** Pesan pengganti kalau teks yang akan ditampilkan berbau sistem. */
export const FRIENDLY_FALLBACK = "Ada kendala. Coba lagi sebentar lagi.";

// Tanda pesan teknis: istilah error berbahasa Inggris, nama layanan atau database, kode konstanta,
// dan simbol kode. Pesan untuk pengguna selalu Bahasa Indonesia biasa (CLAUDE.md bagian 7).
const TECHNICAL: readonly RegExp[] = [
  /\b(error|exception|failed|failure|undefined|null|nan|fetch|network|timeout|timed out|unauthorized|forbidden|internal|server|request|response|status|stack|invalid|denied|violates|constraint|duplicate key|syntax)\b/i,
  /\b(pgrst|jwt|supabase|postgres|postgrest|sql|rpc|api|http|json|typeerror|referenceerror|aborterror)\b/i,
  /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/,
  /[{}<>[\]`]|=>|::|\bat\s+\S+\s*\(/,
];

/**
 * Teks aman untuk pengguna: pesan yang berbau sistem atau kode diganti kalimat ramah. Dipakai toast
 * dan pesan error yang ditampilkan di layar.
 */
export function friendlyMessage(
  text: string | null | undefined,
  fallback = FRIENDLY_FALLBACK,
): string {
  const value = (text ?? "").trim();
  if (!value) return fallback;
  if (value.length > 220 || TECHNICAL.some((pattern) => pattern.test(value))) return fallback;
  return value;
}
