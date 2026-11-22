import type { MetadataRoute } from "next";
import { env } from "@/env";

// Portal (PWA internal), panel CMS, API, halaman dev, dan file brosur tidak diindeks.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/portal", "/cms", "/api", "/dev", "/brosur"] },
    ],
    sitemap: new URL("/sitemap.xml", env.NEXT_PUBLIC_SITE_URL).toString(),
    host: env.NEXT_PUBLIC_SITE_URL,
  };
}
