const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format rupiah untuk tampilan. Nilai disimpan sebagai bigint di database (CLAUDE.md bagian 5).
 * Spasi setelah "Rp" dibuat spasi biasa supaya konsisten di semua browser.
 */
export function formatRupiah(value: bigint | number): string {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new RangeError("Nilai rupiah harus angka berhingga.");
  }
  return rupiahFormatter.format(value).replace(/ /g, " ");
}

/** Mengubah teks masukan ("Rp 1.250.000", "1250000") menjadi bigint. Mengembalikan null kalau tidak valid. */
export function parseRupiah(input: string): bigint | null {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 0 || digits.length > 15) return null;
  return BigInt(digits);
}
