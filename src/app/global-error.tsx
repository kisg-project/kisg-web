"use client";

import { siteConfig } from "@/config/site";
import "./globals.css";

// Cadangan terakhir kalau root layout gagal. Sengaja tanpa komponen lain supaya tetap bisa tampil.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div role="alert" className="max-w-md text-center">
          <h1 className="text-xl font-bold">Website sedang bermasalah.</h1>
          <p className="mt-2 text-muted-foreground">
            Coba muat ulang. Kalau masih gagal, hubungi marketing di WhatsApp{" "}
            {siteConfig.whatsapp.display}.
          </p>
          <button
            type="button"
            onClick={() => {
              retry();
            }}
            className="mt-6 h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
