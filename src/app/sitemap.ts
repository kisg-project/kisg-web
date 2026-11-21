import type { MetadataRoute } from "next";
import { CAREER_LEVELS } from "@/config/careers";
import { env } from "@/env";
import { getActivePromos, getOpenCareers, getPublishedPosts } from "@/features/cms";
import { getPublishedProjects } from "@/features/projects";

// Hanya konten terbit (CLAUDE.md bagian 6). Daftar ikut diperbarui saat cache konten diperbarui.
const STATIC_PAGES: {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/proyek", priority: 0.9, changeFrequency: "weekly" },
  { path: "/simulasi-kpr", priority: 0.8, changeFrequency: "monthly" },
  { path: "/promo", priority: 0.7, changeFrequency: "weekly" },
  { path: "/berita", priority: 0.6, changeFrequency: "weekly" },
  { path: "/karir", priority: 0.5, changeFrequency: "weekly" },
  { path: "/tentang", priority: 0.5, changeFrequency: "monthly" },
  { path: "/kontak", priority: 0.6, changeFrequency: "monthly" },
  { path: "/kebijakan-privasi", priority: 0.2, changeFrequency: "yearly" },
  { path: "/syarat-ketentuan", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
  // Gambar di sitemap membantu foto proyek dan berita muncul di Google Gambar.
  const images = (...sources: (string | null | undefined)[]) =>
    sources.filter((src): src is string => Boolean(src)).map((src) => url(src));
  const [projects, posts, promos, careers] = await Promise.all([
    getPublishedProjects(),
    getPublishedPosts(500),
    getActivePromos(),
    getOpenCareers(),
  ]);
  return [
    ...STATIC_PAGES.map((page) => ({
      url: url(page.path),
      priority: page.priority,
      changeFrequency: page.changeFrequency,
    })),
    ...projects.map((project) => ({
      url: url(`/proyek/${project.slug}`),
      priority: 0.9,
      images: images(project.cover?.src),
    })),
    ...posts.map((post) => ({
      url: url(`/berita/${post.slug}`),
      lastModified: post.publishedAt,
      priority: 0.5,
      images: images(post.cover?.src),
    })),
    ...promos.map((promo) => ({
      url: url(`/promo/${promo.slug}`),
      priority: 0.6,
      images: images(promo.cover?.src),
    })),
    ...CAREER_LEVELS.map((item) => ({
      url: url(`/karir/jenjang/${item.slug}`),
      priority: 0.4,
      images: images(item.image.src),
    })),
    ...careers.map((career) => ({ url: url(`/karir/${career.slug}`), priority: 0.4 })),
  ];
}
