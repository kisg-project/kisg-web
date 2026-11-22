import type { ReactNode } from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { AuthMascot } from "./auth-mascot";

function Dots() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-8 left-8 size-16 rounded-full border-2 border-(--line-strong) bg-gold-100 lg:top-12 lg:left-12 lg:size-24"
      />
      <span
        aria-hidden="true"
        className="absolute top-6 right-10 size-6 rounded-full border-2 border-(--line-strong) bg-violet-100 lg:top-16 lg:right-16 lg:size-9"
      />
      <span
        aria-hidden="true"
        className="absolute right-[18%] bottom-[38%] size-3 rounded-full bg-orange-100 ring-2 ring-(--line-strong) lg:size-4"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-[30%] left-[16%] size-4 rounded-full bg-info-100 ring-2 ring-(--line-strong) lg:size-6"
      />
    </>
  );
}

export function AuthScene({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="app-feel portal-canvas relative flex min-h-dvh flex-col bg-card lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-5 lg:p-5">
      <div className="relative flex h-[32dvh] min-h-52 shrink-0 items-end justify-center overflow-hidden border-b border-(--line-strong) bg-primary-100 lg:h-auto lg:min-h-[calc(100dvh-2.5rem)] lg:rounded-2xl lg:border dark:bg-primary-950">
        <Dots />
        <div className="absolute top-40 left-12 hidden max-w-sm lg:block">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-(--line-strong) bg-card px-3 py-1 text-xs font-medium">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-600" />
            {siteConfig.legalName}
          </p>
          <p className="mt-3 text-2xl leading-tight font-semibold tracking-tight">
            Kerja harian tim KIS dalam satu aplikasi.
          </p>
        </div>
        <AuthMascot className="relative h-[92%] w-auto lg:h-[58%]" />
      </div>

      <main
        id="konten"
        className="relative flex flex-1 flex-col px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-10 lg:justify-center lg:rounded-2xl lg:border lg:border-(--line-strong)"
      >
        <div className={cn("mx-auto flex w-full flex-col", wide ? "max-w-lg" : "max-w-sm")}>
          <div className="flex items-center gap-3">
            <Image
              src={siteConfig.logo.src}
              alt={siteConfig.logo.alt}
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
              loading="eager"
              sizes="96px"
              className="h-9 w-auto"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-(--line-strong) bg-primary-50 px-2.5 py-0.5 text-[0.6875rem] font-medium text-primary-900 dark:bg-primary-950 dark:text-primary-100">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-600" />
              {label}
            </span>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
