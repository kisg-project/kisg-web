import * as Sentry from "@sentry/nextjs";
import { sentryDataCollection } from "@/lib/monitoring/sentry-data-collection";

// Sentry server. Hanya aktif kalau DSN diisi (akun Sentry belum dibuat di Fase 1).
export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    dataCollection: sentryDataCollection,
  });
}

export const onRequestError = Sentry.captureRequestError;
