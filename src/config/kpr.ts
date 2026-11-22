// Nilai awal dan batas simulasi KPR. Semua bisa diubah pengunjung di form.
// Angka asumsi (floating, margin setelah periode tetap, perkiraan biaya) bukan penawaran bank.
// Owner mengonfirmasi acuan dari bank rekanan (docs/TODO-DATA.md). Fase 4: diatur dari admin.

export const KPR_DEFAULTS = {
  downPaymentPercent: 10,
  tenorYears: 15,
  /** Asumsi bunga floating setelah masa fixed (bank tidak mempublikasikan angka pasti). */
  floatingRatePercent: 11,
  /** Asumsi margin setelah periode tetap untuk produk syariah yang tidak tetap sampai lunas. */
  syariahAfterMarginPercent: 10,
  /** UU 1/2022 (HKPD): NPOPTKP paling sedikit Rp 80 juta. Nilai pasti mengikuti perda Kabupaten Bekasi. */
  npoptkp: 80_000_000,
  bphtbRatePercent: 5,
  /** BPHTB ditanggung pengembang, gratis bagi pembeli (keputusan owner, 22 November 2026). */
  bphtbIncluded: true as boolean,
  /** Perkiraan biaya bank (provisi, administrasi, appraisal), notaris bank, dan asuransi. */
  otherCostsPercent: 3,
} as const;

export const KPR_LIMITS = {
  price: { min: 50_000_000, max: 50_000_000_000 },
  downPaymentPercent: { min: 0, max: 90 },
  /** Batas slider uang muka di UI. Nominal tetap bisa diisi sampai batas maksimal. */
  downPaymentSliderMax: 50,
  tenorYears: { min: 1, max: 30 },
  ratePercent: { min: 0, max: 30 },
  segments: { max: 4 },
} as const;

/** Rincian biaya yang tampil di simulasi. "included" = sudah termasuk harga rumah KIS. */
export const KPR_COST_GROUPS = [
  {
    title: "Sudah termasuk harga rumah",
    included: true,
    items: [
      "Biaya notaris akta jual beli",
      "Cek sertifikat di BPN",
      "Balik nama sertifikat di BPN",
      "Pajak penjualan (SSP)",
      "Pajak pembelian (BPHTB)",
      "IMB",
      "PBB",
    ],
  },
  {
    title: "Biaya bank",
    included: false,
    items: ["Provisi", "Administrasi", "Appraisal"],
  },
  {
    title: "Biaya notaris bank",
    included: false,
    items: ["Akta SKMHT", "Akta APHT", "Perjanjian hak tanggungan", "PNBP hak tanggungan"],
  },
  {
    title: "Asuransi",
    included: false,
    items: ["Asuransi jiwa", "Asuransi kebakaran"],
  },
] as const;
