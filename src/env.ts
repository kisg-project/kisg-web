import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Variabel env divalidasi saat build dan saat server mulai (CLAUDE.md bagian 3).
// Kunci Supabase dibaca saat runtime oleh server (bukan NEXT_PUBLIC), supaya satu build bisa dipakai
// di CI (Supabase lokal) dan di Vercel (production). Halaman publik tidak memakainya.
// Variabel fase berikutnya (Meta, Gemini, Brevo, Turnstile) ditambah saat dibutuhkan.
export const env = createEnv({
  server: {
    SUPABASE_URL: z.url().optional(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    ENABLE_DEV_UI: z.enum(["0", "1"]).optional(),
    // Cloudflare Turnstile. Kosong sampai akun Cloudflare siap: verifikasi dilewati, form tetap dijaga
    // honeypot dan rate limit (src/lib/security/turnstile.ts).
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
    // Host portal karyawan, misal company.kisgroup.co.id (harus berawalan "company.", lihat proxy.ts).
    // Kosong sampai domain terhubung: portal tetap di /portal.
    PORTAL_HOST: z
      .string()
      .regex(/^company\.[a-z0-9.-]+(:\d+)?$/, "PORTAL_HOST harus berawalan company.")
      .optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    ENABLE_DEV_UI: process.env.ENABLE_DEV_UI,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    PORTAL_HOST: process.env.PORTAL_HOST,
    // Preview Vercel: URL berubah per deploy, jadi memakai variabel sistem NEXT_PUBLIC_VERCEL_URL.
    // Production wajib diisi eksplisit (https://kisgroup.co.id) di env Vercel.
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : undefined),
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
  emptyStringAsUndefined: true,
});
