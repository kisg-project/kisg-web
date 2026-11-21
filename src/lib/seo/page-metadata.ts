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

/** URL gambar share bermerek untuk path halaman (statis atau konten). */
export function ogImageUrl(path: string): string {
  return `/og?p=${encodeURIComponent(path)}`;
}

/**
 * Metadata share lengkap untuk satu halaman: deskripsi, canonical, Open Graph, dan Twitter card dengan
 * gambar bermerek dari /og. Judul tab memakai templat root ("... | KIS Group").
 */
export function shareMetadata({
  path,
  title,
  description,
  imageAlt,
  type = "website",
  publishedTime,
}: {
  path: string;
  /** Judul tab. Kosongkan untuk beranda (judul default layout root). */
  title?: string;
  description: string;
  imageAlt: string;
  type?: "website" | "article";
  publishedTime?: string;
}): Metadata {
  const shareTitle = `${title ?? imageAlt} | ${siteConfig.name}`;
  const image = { url: ogImageUrl(path), width: 1200, height: 630, alt: imageAlt };
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: "id_ID",
      url: path,
      siteName: siteConfig.name,
      title: shareTitle,
      description,
      images: [image],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image.url],
    },
  };
}

/** Metadata halaman statis yang terdaftar di OG_PAGES (CLAUDE.md bagian 6, SEO). */
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
  return shareMetadata({ path, title, description, imageAlt: OG_PAGES[path].title });
}
