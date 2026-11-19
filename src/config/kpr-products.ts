// Produk KPR bank rekanan untuk simulasi (permintaan owner, 19 November 2026).
// Angka diambil dari sumber publik dan dicatat sumbernya. Semua angka tetap bisa diubah pengunjung,
// dan wajib dikonfirmasi owner ke bank rekanan (docs/TODO-DATA.md). Fase 4: diatur dari admin.
// Periode tetap yang tidak dipublikasikan diisi asumsi KPR_DEFAULTS dan ditandai di UI.

import type { RateSegment } from "@/features/kpr";

export type KprScheme = "konvensional" | "syariah";

export interface KprProduct {
  id: string;
  bankKey: "btn" | "mandiri" | "bsi" | "bsn";
  scheme: KprScheme;
  name: string;
  /** Periode tetap berurutan. */
  segments: readonly RateSegment[];
  /** null: setelah periode tetap memakai asumsi default (floating atau margin setelah periode tetap). */
  afterRatePercent: number | null;
  tenor: { min: number; max: number };
  /** Akad untuk produk syariah. */
  akad?: string;
  note?: string;
  source: {
    label: string;
    url: string;
    accessedOn: string;
    /** true: halaman resmi bank. false: pemberitaan yang mengutip bank, perlu konfirmasi. */
    official: boolean;
  };
}

const MANDIRI_SOURCE = {
  label: "Bank Mandiri, KPR Bunga Spesial (s.d. 30 November 2026)",
  url: "https://www.bankmandiri.co.id/kpr-bunga-spesial",
  accessedOn: "2026-11-19",
  official: true,
} as const;

export const KPR_PRODUCTS: readonly KprProduct[] = [
  {
    id: "mandiri-fixed-3",
    bankKey: "mandiri",
    scheme: "konvensional",
    name: "Mandiri KPR Bunga Spesial Fixed 3 Tahun",
    segments: [{ ratePercent: 2.76, years: 3 }],
    afterRatePercent: null,
    tenor: { min: 15, max: 30 },
    note: "Kategori Gold Selected KPR Primary. Bunga sesuai kategori nasabah.",
    source: MANDIRI_SOURCE,
  },
  {
    id: "mandiri-fixed-5",
    bankKey: "mandiri",
    scheme: "konvensional",
    name: "Mandiri KPR Bunga Spesial Fixed 5 Tahun",
    segments: [{ ratePercent: 3.5, years: 5 }],
    afterRatePercent: null,
    tenor: { min: 15, max: 30 },
    note: "Kategori Gold Selected KPR Primary. Bunga sesuai kategori nasabah.",
    source: MANDIRI_SOURCE,
  },
  {
    id: "mandiri-berjenjang-10",
    bankKey: "mandiri",
    scheme: "konvensional",
    name: "Mandiri KPR Bunga Berjenjang 10 Tahun",
    segments: [
      { ratePercent: 4.06, years: 3 },
      { ratePercent: 8.76, years: 3 },
      { ratePercent: 9.76, years: 4 },
    ],
    afterRatePercent: null,
    tenor: { min: 15, max: 30 },
    note: "Kategori Gold Selected KPR Primary. Bunga sesuai kategori nasabah.",
    source: MANDIRI_SOURCE,
  },
  {
    id: "btn-fixed-3",
    bankKey: "btn",
    scheme: "konvensional",
    name: "KPR BTN Fixed 3 Tahun",
    segments: [{ ratePercent: 2.65, years: 3 }],
    afterRatePercent: null,
    tenor: { min: 5, max: 30 },
    source: {
      label: "Kontan, mengutip BTN",
      url: "https://keuangan.kontan.co.id/news/btn-tawarkan-kpr-bunga-265-dan-diskon-biaya-hingga-76",
      accessedOn: "2026-11-19",
      official: false,
    },
  },
  {
    id: "bsi-sejahtera",
    bankKey: "bsi",
    scheme: "syariah",
    name: "BSI KPR Sejahtera",
    // Margin tetap sampai lunas: tanpa periode bertingkat, margin berlaku dari awal.
    segments: [],
    afterRatePercent: 5,
    tenor: { min: 5, max: 30 },
    akad: "Murabahah",
    note: "Margin tetap sampai lunas.",
    source: {
      label: "Kontan, mengutip BSI",
      url: "https://keuangan.kontan.co.id/news/simak-tawaran-bsi-griya-spesial-margin-275-di-danantara-housing-expo-2026",
      accessedOn: "2026-11-19",
      official: false,
    },
  },
  {
    id: "bsn-fixed-1",
    bankKey: "bsn",
    scheme: "syariah",
    name: "BSN KPR Non Subsidi Margin Tetap 1 Tahun",
    segments: [{ ratePercent: 3.65, years: 1 }],
    afterRatePercent: null,
    tenor: { min: 5, max: 30 },
    akad: "Murabahah atau Musyarakah Mutanaqisah, sesuai ketentuan bank",
    note: "Margin setelah tahun pertama mengikuti ketentuan bank.",
    source: {
      label: "Kontan, mengutip BSN",
      url: "https://keuangan.kontan.co.id/news/hingga-mei-2026-penyaluran-pembiayaan-kpr-bsn-capai-rp-531-triliun",
      accessedOn: "2026-11-19",
      official: false,
    },
  },
];

export function productsFor(scheme: KprScheme): KprProduct[] {
  return KPR_PRODUCTS.filter((product) => product.scheme === scheme);
}

/** Bunga atau margin terendah yang ditawarkan produk (untuk "mulai dari"). */
export function lowestRate(product: KprProduct): number {
  const rates = product.segments.map((segment) => segment.ratePercent);
  if (product.afterRatePercent !== null) rates.push(product.afterRatePercent);
  return Math.min(...rates);
}

/** Lama periode tetap pertama, atau null kalau tetap sampai lunas. */
export function firstFixedYears(product: KprProduct): number | null {
  return product.segments[0]?.years ?? null;
}
