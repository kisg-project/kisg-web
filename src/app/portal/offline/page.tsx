import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { RetryButton } from "@/features/pwa/components/retry-button";

export const metadata: Metadata = { title: "Sedang offline" };

/** Halaman offline portal. Disimpan service worker saat dipasang, tampil kalau jaringan putus. */
export default function OfflinePage() {
  return (
    <main
      id="konten"
      className="flex flex-1 items-center justify-center bg-surface px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]"
    >
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 text-center shadow-sm sm:p-8">
        <Image
          src={siteConfig.logo.src}
          alt={siteConfig.logo.alt}
          width={siteConfig.logo.width}
          height={siteConfig.logo.height}
          loading="eager"
          sizes="128px"
          className="mx-auto h-12 w-auto"
        />
        <h1 className="mt-6 text-xl font-bold">Anda sedang offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Periksa koneksi internet, lalu muat ulang halaman.
        </p>
        <div className="mt-6">
          <RetryButton />
        </div>
      </div>
    </main>
  );
}
