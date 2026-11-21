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
  // 'wasm-unsafe-eval': deteksi wajah absensi (MediaPipe WASM), tanpa mengizinkan eval JavaScript.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
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

// Gambar konten yang diunggah lewat panel CMS disimpan di bucket publik Supabase Storage.
const supabaseImages = (() => {
  try {
    if (!process.env.SUPABASE_URL) return [];
    const url = new URL(process.env.SUPABASE_URL);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: supabaseImages,
    // Hanya build E2E di CI: Supabase lokal berjalan di 127.0.0.1. Production memakai host publik.
    dangerouslyAllowLocalIP: process.env.E2E_SUPABASE === "1",
  },
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
