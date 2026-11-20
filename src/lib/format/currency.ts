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

/**
 * Harga dibulatkan ke bawah untuk label singkat, misal Rp 571.250.000 menjadi "Rp 500 jutaan".
 * Di bawah 1 miliar: kelipatan 100 juta. Mulai 1 miliar: kelipatan 0,1 miliar ("Rp 1,2 miliaran").
 * Dibulatkan ke bawah supaya tidak pernah lebih tinggi dari harga sebenarnya.
 */
export function formatRupiahRange(value: bigint | number): string {
  const amount = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("Nilai rupiah harus angka berhingga dan tidak negatif.");
  }
  if (amount < 100_000_000) return formatRupiah(amount);
  if (amount < 1_000_000_000) {
    return `Rp ${String(Math.floor(amount / 100_000_000) * 100)} jutaan`;
  }
  const billions = Math.floor(amount / 100_000_000) / 10;
  return `Rp ${billions.toLocaleString("id-ID", { maximumFractionDigits: 1 })} miliaran`;
}

/** Mengubah teks masukan ("Rp 1.250.000", "1250000") menjadi bigint. Mengembalikan null kalau tidak valid. */
export function parseRupiah(input: string): bigint | null {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 0 || digits.length > 15) return null;
  return BigInt(digits);
}
