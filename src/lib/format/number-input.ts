// Format angka untuk input bergaya Indonesia: titik pemisah ribuan, koma desimal.
// "571250000" -> "571.250.000", "7.5" atau "7,5" -> "7,5".

export interface NumberInputOptions {
  /** Jumlah digit desimal yang boleh diketik. 0 untuk rupiah. */
  decimals: number;
}

/** Membersihkan teks ketikan menjadi digit, dengan satu koma desimal kalau diizinkan. */
export function sanitizeNumberText(text: string, { decimals }: NumberInputOptions): string {
  let integer = "";
  let fraction = "";
  let seenComma = false;
  const hasComma = text.includes(",");
  for (const char of text) {
    if (char >= "0" && char <= "9") {
      if (seenComma) fraction += char;
      else integer += char;
    } else if (decimals > 0 && !seenComma && (char === "," || (char === "." && !hasComma))) {
      // Koma selalu desimal. Titik dianggap desimal hanya kalau tidak ada koma (ketikan "7.5").
      // Untuk teks yang sudah berformat ("1.250,5"), titik adalah pemisah ribuan dan diabaikan.
      if (char === "," || !/\.\d{3}(\D|$)/.test(text)) seenComma = true;
    }
  }
  integer = integer.replace(/^0+(?=\d)/, "");
  if (!seenComma) return integer;
  return `${integer || "0"},${fraction.slice(0, decimals)}`;
}

/** Menambahkan titik ribuan ke teks yang sudah dibersihkan. */
export function formatNumberText(clean: string): string {
  const [integer = "", fraction] = clean.split(",");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fraction === undefined ? grouped : `${grouped},${fraction}`;
}

/** Teks berformat Indonesia ke angka. Kosong atau tidak valid menjadi NaN. */
export function parseNumberText(text: string): number {
  const clean = text.replace(/\./g, "").replace(",", ".");
  if (clean === "" || clean === ".") return Number.NaN;
  return Number(clean);
}

/** Angka ke teks input berformat Indonesia. */
export function numberToInputText(value: number, { decimals }: NumberInputOptions): string {
  if (!Number.isFinite(value)) return "";
  const rounded = decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
  const [integer = "0", fraction] = String(rounded).split(".");
  return formatNumberText(fraction ? `${integer},${fraction}` : integer);
}

/**
 * Posisi kursor setelah teks diformat ulang: kursor tetap di belakang jumlah digit (dan koma)
 * yang sama seperti sebelum format.
 */
export function caretAfterFormat(formatted: string, significantBeforeCaret: number): number {
  if (significantBeforeCaret <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    const char = formatted.charAt(index);
    if ((char >= "0" && char <= "9") || char === ",") seen += 1;
    if (seen === significantBeforeCaret) return index + 1;
  }
  return formatted.length;
}

/**
 * Jumlah digit dan koma desimal sebelum kursor, dihitung dengan aturan pembersihan yang sama,
 * supaya titik ribuan tidak ikut dihitung.
 */
export function significantCount(text: string, caret: number, options: NumberInputOptions): number {
  return sanitizeNumberText(text.slice(0, caret), options).length;
}
