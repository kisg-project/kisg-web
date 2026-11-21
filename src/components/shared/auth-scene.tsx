import type { ReactNode } from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Cincin garis dekoratif di sudut lembar (tidak dibaca pembaca layar). */
function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" className={className}>
      {[0, 24, 48, 72, 96, 120].map((angle) => (
        <ellipse
          key={angle}
          cx="110"
          cy="100"
          rx="78"
          ry="52"
          stroke="currentColor"
          strokeWidth="0.8"
          transform={`rotate(${String(angle)} 110 100)`}
        />
      ))}
    </svg>
  );
}

/**
 * Kerangka halaman masuk dan aktivasi gaya aplikasi (keputusan owner, 21 November 2026, mengikuti
 * aplikasi Shaflow): foto proyek besar, lembar form bersudut lebar yang menumpuk di atas foto di HP,
 * dan dua kolom di desktop.
 */
export function AuthScene({
  label,
  wide = false,
  children,
}: {
  /** Nama aplikasi kecil di atas judul, misal "KIS Operasional" atau "Panel CMS". */
  label: string;
  /** Lembar lebih lebar untuk form panjang (aktivasi). */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="app-feel relative flex min-h-dvh flex-col bg-primary-50 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6 lg:p-5">
      <div className="relative h-[38dvh] min-h-56 shrink-0 overflow-hidden lg:h-auto lg:min-h-[calc(100dvh-2.5rem)] lg:rounded-[2.5rem]">
        <Image
          src="/images/projects/sejahtera-green-village/sgv-1.webp"
          alt=""
          fill
          preload
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-[50%_60%]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-primary-950/70 via-primary-950/10 to-primary-950/30"
        />
        <div className="absolute inset-x-6 bottom-14 hidden text-white lg:block">
          <p className="text-sm font-semibold tracking-wide text-gold-300 uppercase">
            {siteConfig.legalName}
          </p>
          <p className="mt-2 max-w-md text-3xl leading-tight font-semibold">
            Kerja harian tim KIS dalam satu aplikasi.
          </p>
        </div>
      </div>

      <main
        id="konten"
        className="relative z-10 -mt-10 flex flex-1 flex-col overflow-hidden rounded-t-[2.25rem] bg-background px-6 pt-9 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-[0_-24px_48px_-36px_rgb(11_61_54/0.55)] sm:px-10 lg:mt-0 lg:justify-center lg:rounded-[2.5rem] lg:shadow-none"
      >
        <Rings className="pointer-events-none absolute top-6 -right-10 w-44 text-primary-200 lg:top-10 lg:right-6 lg:w-56" />
        <div
          className={cn("relative mx-auto flex w-full flex-col", wide ? "max-w-lg" : "max-w-md")}
        >
          <div className="flex items-center gap-3">
            <Image
              src={siteConfig.logo.src}
              alt={siteConfig.logo.alt}
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
              loading="eager"
              sizes="96px"
              className="h-10 w-auto"
            />
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
              {label}
            </span>
          </div>
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}
