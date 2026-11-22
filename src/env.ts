import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_URL: z.url().optional(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    SENTRY_ORG: z.string().min(1).optional(),
    SENTRY_PROJECT: z.string().min(1).optional(),
    ENABLE_DEV_UI: z.enum(["0", "1"]).optional(),
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
    PORTAL_HOST: z
      .string()
      .regex(/^company\.[a-z0-9.-]+(:\d+)?$/, "PORTAL_HOST harus berawalan company.")
      .optional(),
    CMS_HOST: z
      .string()
      .regex(/^cms\.[a-z0-9.-]+(:\d+)?$/, "CMS_HOST harus berawalan cms.")
      .optional(),
    BREVO_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.email().default("notifikasi@kisgroup.co.id"),
    EMAIL_FROM_NAME: z.string().min(1).default("KIS Group"),
    EMAIL_REPLY_TO: z.email().default("corporate@kisgroup.co.id"),
    MAILPIT_URL: z.url().optional(),
    VAPID_PUBLIC_KEY: z.string().min(1).optional(),
    VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    VAPID_SUBJECT: z.string().min(1).default("mailto:notifikasi@kisgroup.co.id"),
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL: z.string().min(1).default("gemini-3.5-flash"),
    CHAT_THINKING: z.enum(["minimal", "low", "medium"]).default("low"),
    CHAT_DAILY_TOKEN_LIMIT: z.coerce.number().int().positive().default(2_000_000),
    CHAT_MOCK: z.enum(["0", "1"]).optional(),
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
    CMS_HOST: process.env.CMS_HOST,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    MAILPIT_URL: process.env.MAILPIT_URL,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    CHAT_THINKING: process.env.CHAT_THINKING,
    CHAT_DAILY_TOKEN_LIMIT: process.env.CHAT_DAILY_TOKEN_LIMIT,
    CHAT_MOCK: process.env.CHAT_MOCK,
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
