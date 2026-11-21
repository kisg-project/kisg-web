import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP awal (Fase 1). Domain Meta, Turnstile, Sentry, dan Supabase ditambah di fase yang membutuhkannya.
// script-src memakai 'unsafe-inline' karena CSP berbasis nonce memaksa semua halaman dirender dinamis,
// sedangkan halaman publik harus statis. Ditinjau ulang di Fase 9.
// Tanpa upgrade-insecure-requests: Vercel selalu HTTPS (ditambah HSTS), dan direktif itu membuat
// WebKit memaksa HTTPS ke server E2E lokal http://127.0.0.1 sehingga semua aset gagal dimuat.
// Foto profil portal dibaca lewat signed URL Supabase Storage (bucket privat), jadi origin Supabase
// diizinkan untuk gambar. Diambil dari env saat build (CI: Supabase lokal, Vercel: production).
const supabaseOrigin = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : "";
  } catch {
    return "";
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self'",
  "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  // Cloudflare Turnstile (form publik) memakai iframe dari domain ini.
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Kamera dan lokasi dipakai portal (absensi, laporan lapangan) dari origin sendiri.
    value:
      "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: securityHeaders }]);
  },
};

export default nextConfig;
