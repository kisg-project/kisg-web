"use client";

import Image from "next/image";
import { siteConfig } from "@/config/site";
import "./globals.css";

function platformOf(): { name: string; home: string; help: string } {
  const { hostname, pathname } = window.location;
  if (hostname.startsWith("company.") || pathname.startsWith("/portal")) {
    return { name: "KIS Operasional", home: "/portal", help: "Kalau masih gagal, hubungi admin." };
  }
  if (hostname.startsWith("cms.") || pathname.startsWith("/cms")) {
    return { name: "Panel CMS", home: "/cms", help: "Kalau masih gagal, hubungi admin." };
  }
  return {
    name: siteConfig.name,
    home: "/",
    help: `Kalau masih gagal, hubungi marketing di WhatsApp ${siteConfig.whatsapp.display}.`,
  };
}

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const platform = typeof window === "undefined" ? null : platformOf();
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-primary-50 p-6 text-foreground">
        <div
          role="alert"
          className="w-full max-w-md rounded-[2.5rem] border border-primary-100 bg-card px-8 py-10 text-center shadow-sm"
        >
          <Image
            src="/brand/logo-kis.png"
            alt={siteConfig.name}
            width={160}
            height={48}
            className="mx-auto h-10 w-auto"
          />
          <p className="mt-6 text-sm font-semibold text-primary-700 tabular-nums">Kode 500</p>
          <h1 className="mt-1 text-xl font-bold">
            {platform?.name ?? siteConfig.name} sedang bermasalah
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Muat ulang halaman. {platform?.help ?? ""}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                retry();
              }}
              className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Muat ulang
            </button>
            <a
              href={platform?.home ?? "/"}
              className="flex h-11 items-center rounded-full border border-border px-5 font-semibold hover:bg-primary-50"
            >
              Ke beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
