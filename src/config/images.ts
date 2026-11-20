// Batas kompresi gambar di browser (CLAUDE.md bagian 8).
// Batas keras di server (bucket Storage) lebih longgar, lihat docs/data-model.md bagian 14.

export const IMAGE_PROFILES = {
  /** Foto konten website: proyek, berita, promo, banner. */
  content: { maxEdge: 2048, targetBytes: 500 * 1024 },
  /** Foto laporan lapangan, material, kendala. Bisa diturunkan setelah keputusan owner (Fase 8). */
  siteReport: { maxEdge: 1600, targetBytes: 300 * 1024 },
  /** Selfie absensi. */
  attendance: { maxEdge: 800, targetBytes: 150 * 1024 },
  /** Foto profil akun portal, dipotong persegi sebelum dikompres. */
  avatar: { maxEdge: 512, targetBytes: 100 * 1024 },
  /** Dokumen konsumen (KTP, slip gaji). Harus tetap terbaca. */
  document: { maxEdge: 2000, targetBytes: 800 * 1024 },
} as const satisfies Record<string, ImageProfile>;

export interface ImageProfile {
  maxEdge: number;
  targetBytes: number;
}

export type ImageProfileName = keyof typeof IMAGE_PROFILES;

/** Tipe file yang diterima sebagai masukan kompresi. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** Urutan kualitas yang dicoba sampai ukuran di bawah target. */
export const QUALITY_STEPS = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42] as const;

/** Kalau kualitas terendah masih di atas target, sisi terpanjang dikecilkan dengan faktor ini lalu dicoba lagi. */
export const DOWNSCALE_FACTOR = 0.8;

/** Batas bawah sisi terpanjang supaya foto tetap berguna. */
export const MIN_EDGE = 640;
