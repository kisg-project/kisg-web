import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * Judul dan keterangan gambar share untuk halaman statis website. Route /og hanya mau membuat gambar
 * untuk path yang terdaftar di sini, jadi domain KIS tidak bisa dipakai membuat gambar berisi teks bebas.
 */
export const OG_PAGES = {
  "/": {
    title: siteConfig.featuredProject.name,
    subtitle: `Rumah di ${siteConfig.featuredProject.area}, Kabupaten Bekasi. Dikembangkan oleh ${siteConfig.legalName}.`,
  },
  "/proyek": {
    title: "Proyek perumahan KIS Group",
    subtitle:
      "Proyek yang sedang dipasarkan dan portofolio yang sudah terjual habis di Bekasi dan Depok.",
  },
  "/simulasi-kpr": {
    title: "Simulasi KPR",
    subtitle: "Hitung angsuran KPR konvensional dan syariah dari bank rekanan, lalu unduh PDF.",
  },
  "/promo": {
    title: "Promo yang berlaku",
    subtitle: "Penawaran pembelian rumah KIS Group, lengkap dengan masa berlaku dan syaratnya.",
  },
  "/berita": {
    title: "Berita dan panduan",
    subtitle: "Kabar KPR, kebijakan perumahan, dan panduan membeli rumah pertama.",
  },
  "/karir": {
    title: "Karir di KIS Group",
    subtitle: "Lowongan untuk tenaga berpengalaman, lulusan baru, staf lapangan, dan magang.",
  },
  "/tentang": {
    title: "Tentang KIS Group",
    subtitle: `${siteConfig.legalName}, developer perumahan di Kabupaten Bekasi sejak ${String(siteConfig.company.foundedYear)}.`,
  },
  "/kontak": {
    title: "Hubungi KIS Group",
    subtitle: `WhatsApp ${siteConfig.whatsapp.display}, email ${siteConfig.emails[0].address}, dan kantor pemasaran di Bekasi Utara.`,
  },
  "/kebijakan-privasi": {
    title: "Kebijakan privasi",
    subtitle: "Cara KIS Group mengumpulkan, memakai, dan melindungi data pribadi Anda.",
  },
  "/syarat-ketentuan": {
    title: "Syarat dan ketentuan",
    subtitle: "Ketentuan pemakaian website KIS Group.",
  },
} as const satisfies Record<string, { title: string; subtitle: string }>;

export type OgPagePath = keyof typeof OG_PAGES;

export function isOgPagePath(path: string): path is OgPagePath {
  return Object.hasOwn(OG_PAGES, path);
}

/** URL gambar share bermerek untuk path halaman statis. */
export function ogImageUrl(path: OgPagePath): string {
  return `/og?p=${encodeURIComponent(path)}`;
}

/**
 * Metadata lengkap halaman statis: judul tab, deskripsi, canonical, Open Graph, dan Twitter card dengan
 * gambar share bermerek (CLAUDE.md bagian 6, SEO).
 */
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: OgPagePath;
  /** Judul tab. Templat root menambahkan "| KIS Group". Kosongkan untuk beranda. */
  title?: string;
  description: string;
}): Metadata {
  const og = OG_PAGES[path];
  const shareTitle = title ? `${title} | ${siteConfig.name}` : `${og.title} | ${siteConfig.name}`;
  const image = { url: ogImageUrl(path), width: 1200, height: 630, alt: og.title };
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: path,
      siteName: siteConfig.name,
      title: shareTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image.url],
    },
  };
}
