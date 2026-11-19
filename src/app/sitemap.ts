import type { MetadataRoute } from "next";
import { env } from "@/env";

// Fase 3: halaman proyek, berita, promo, dan karir ditambahkan dari database (hanya yang terbit).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", env.NEXT_PUBLIC_SITE_URL).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/simulasi-kpr", env.NEXT_PUBLIC_SITE_URL).toString(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
