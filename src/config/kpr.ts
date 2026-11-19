// Nilai awal simulasi KPR. Semua bisa diubah pengunjung di form.
// Angka bunga dan margin di sini contoh untuk mengisi form, bukan penawaran bank.
// Owner mengonfirmasi acuan dari bank rekanan (docs/TODO-DATA.md). Fase 4: diatur dari admin (site_settings).

export const KPR_DEFAULTS = {
  konvensional: {
    downPaymentPercent: 10,
    tenorYears: 15,
    fixedRatePercent: 7.5,
    fixedYears: 3,
    floatingRatePercent: 11,
  },
  syariah: {
    downPaymentPercent: 10,
    tenorYears: 15,
    marginPercent: 5,
  },
} as const;

export const KPR_LIMITS = {
  price: { min: 50_000_000, max: 50_000_000_000 },
  downPaymentPercent: { min: 0, max: 90 },
  tenorYears: { min: 1, max: 30 },
  ratePercent: { min: 0, max: 30 },
} as const;
