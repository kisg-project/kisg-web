import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Variabel env divalidasi saat build dan saat server mulai (CLAUDE.md bagian 3).
// Variabel fase berikutnya (Supabase, Meta, Gemini, Resend, Turnstile) ditambah saat dibutuhkan.
export const env = createEnv({
  server: {
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    ENABLE_DEV_UI: z.enum(["0", "1"]).optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  },
  runtimeEnv: {
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    ENABLE_DEV_UI: process.env.ENABLE_DEV_UI,
    // Preview Vercel: URL berubah per deploy, jadi memakai variabel sistem NEXT_PUBLIC_VERCEL_URL.
    // Production wajib diisi eksplisit (https://kisgroup.co.id) di env Vercel.
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : undefined),
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  emptyStringAsUndefined: true,
});
