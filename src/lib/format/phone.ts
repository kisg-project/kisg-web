// Nomor HP Indonesia dinormalisasi ke E.164 (+62...) sebelum disimpan (CLAUDE.md bagian 5).
// Fungsi Postgres normalize_phone() di Fase 2 harus memberi hasil yang sama.

/** Jumlah digit setelah kode negara 62 untuk nomor Indonesia (seluler dan telepon rumah). */
const MIN_NATIONAL_DIGITS = 8;
const MAX_NATIONAL_DIGITS = 12;

/**
 * "0896-7329-6881", "62 896 7329 6881", "+62 896-7329-6881", "8967329 6881" menjadi "+6289673296881".
 * Mengembalikan null kalau bukan nomor Indonesia yang valid.
 */
export function normalizePhoneID(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (/[^\d\s()+.-]/.test(trimmed)) return null;
  if (trimmed.indexOf("+") > 0) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    if (!digits.startsWith("62")) return null;
    digits = digits.slice(2);
  } else if (digits.startsWith("62")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.startsWith("0")) return null;
  if (digits.length < MIN_NATIONAL_DIGITS || digits.length > MAX_NATIONAL_DIGITS) return null;
  return `+62${digits}`;
}

/** Nomor seluler Indonesia (diawali 8 setelah kode negara). Dipakai untuk WhatsApp dan form lead. */
export function isIndonesianMobile(e164: string): boolean {
  return /^\+628\d{8,11}$/.test(e164);
}

/** "+6289673296881" menjadi "+62 896-7329-6881". */
export function formatPhoneDisplay(e164: string): string {
  const match = /^\+62(\d+)$/.exec(e164);
  const national = match?.[1];
  if (!national) return e164;
  const head = national.slice(0, 3);
  const middle = national.slice(3, 7);
  const tail = national.slice(7);
  return ["+62", [head, middle, tail].filter(Boolean).join("-")].join(" ");
}

/** Nomor untuk link wa.me: tanpa tanda plus. */
export function toWhatsAppNumber(e164: string): string {
  return e164.replace(/^\+/, "");
}
