// Data Sejahtera Green Village dari owner (19 November 2026).
// Sementara di config. Pindah ke tabel projects, unit_types, nearby_places di Fase 2 dan 3, lalu diatur dari admin.
// Data yang belum lengkap (jarak ke tempat sekitar) dicatat di docs/TODO-DATA.md.

export const featuredProject = {
  slug: "sejahtera-green-village",
  name: "Sejahtera Green Village",
  area: "Tambun Selatan",
  regency: "Kabupaten Bekasi",
  address: {
    street: "Jl. Garuda 3 No. NK-34, Blok H-21, RT 9/RW 14",
    village: "Mangunjaya",
    district: "Kec. Tambun Selatan",
    city: "Kab. Bekasi",
    province: "Jawa Barat",
    postalCode: "17510",
  },
  unitType: {
    name: "Tipe 36/60",
    buildingArea: 36,
    landArea: 60,
    bedrooms: 2,
    bathrooms: 1,
    /** Harga dalam rupiah (owner, 22 November 2026). Di database disimpan sebagai bigint. */
    price: 570_000_000,
  },
  /** Rincian biaya dari owner (19 November 2026). */
  priceIncludes: [
    "Biaya notaris",
    "Biaya cek sertifikat di BPN",
    "Biaya balik nama sertifikat di BPN",
    "Pajak penjualan (SSP)",
    "Pajak pembelian (BPHTB)",
    "IMB",
    "PBB",
  ],
  priceExcludes: ["Administrasi bank", "Biaya notaris bank", "Asuransi"],
  features: [
    { key: "carport", label: "Carport" },
    { key: "backyard", label: "Halaman belakang" },
    { key: "smartLock", label: "Smart door lock" },
  ],
  /** Jarak atau waktu tempuh belum ada dari owner, jadi tidak ditampilkan. */
  nearby: [
    { key: "station", label: "Stasiun Tambun" },
    { key: "toll", label: "Tol Bekasi Timur" },
    { key: "bank", label: "Bank Mandiri KCP Mangunjaya" },
    { key: "shopping", label: "Superindo dan area komersial Tambun" },
  ],
} as const;

export type FeaturedProject = typeof featuredProject;

/** Alamat proyek dalam satu baris. */
export function formatProjectAddress(
  address: FeaturedProject["address"] = featuredProject.address,
): string {
  return [
    address.street,
    address.village,
    address.district,
    address.city,
    `${address.province} ${address.postalCode}`,
  ].join(", ");
}
