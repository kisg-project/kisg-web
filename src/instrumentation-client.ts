import { sentryDataCollection } from "@/lib/monitoring/sentry-data-collection";

// Sentry browser. Dimuat lewat dynamic import hanya kalau DSN diisi,
// supaya bundle halaman publik tidak bertambah selama Sentry belum dipakai.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      dataCollection: sentryDataCollection,
    });
  });
}
