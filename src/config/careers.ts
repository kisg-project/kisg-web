import type { Database } from "@/lib/supabase/database.types";

/** Nilai enum Postgres `career_level` (sumber kebenaran yang sama dengan migrasi). */
export type CareerLevel = Database["public"]["Enums"]["career_level"];

export interface CareerLevelInfo {
  level: CareerLevel;
  /** Segmen URL: /karir/jenjang/[slug]. */
  slug: string;
  title: string;
  description: string;
  image: { src: string; alt: string };
}

/**
 * Jenjang lowongan di halaman karir (keputusan owner, 20 November 2026). Foto stok Unsplash,
 * kreditnya di docs/brand.md.
 */
export const CAREER_LEVELS: readonly CareerLevelInfo[] = [
  {
    level: "berpengalaman",
    slug: "berpengalaman",
    title: "Berpengalaman",
    description: "Lebih dari 3 tahun pengalaman di bidangnya.",
    image: {
      src: "/images/karir/berpengalaman.webp",
      alt: "Foto ilustrasi dua rekan kerja berdiskusi di depan laptop",
    },
  },
  {
    level: "lulusan_baru",
    slug: "lulusan-baru",
    title: "Lulusan baru",
    description: "Lulusan baru atau pengalaman kurang dari 3 tahun.",
    image: {
      src: "/images/karir/lulusan-baru.webp",
      alt: "Foto ilustrasi karyawan muda bekerja di depan komputer",
    },
  },
  {
    level: "lapangan",
    slug: "lapangan",
    title: "Staf lapangan",
    description: "Pengawas, mandor, dan staf teknik di lokasi pembangunan.",
    image: {
      src: "/images/karir/lapangan.webp",
      alt: "Foto ilustrasi pekerja konstruksi memakai helm proyek",
    },
  },
  {
    level: "magang",
    slug: "magang",
    title: "Magang",
    description: "Mahasiswa aktif yang ingin belajar di proyek perumahan.",
    image: {
      src: "/images/karir/magang.webp",
      alt: "Foto ilustrasi mahasiswa magang berdiskusi dengan pembimbing",
    },
  },
];

export function careerLevelBySlug(slug: string): CareerLevelInfo | undefined {
  return CAREER_LEVELS.find((item) => item.slug === slug);
}

export function careerLevelInfo(level: CareerLevel | null): CareerLevelInfo | undefined {
  return level ? CAREER_LEVELS.find((item) => item.level === level) : undefined;
}
