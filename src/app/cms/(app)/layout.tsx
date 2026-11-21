import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CmsNav, CmsUserMenu } from "./_components/cms-shell";

export default function CmsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
          <Link
            href="/cms"
            aria-label="Panel CMS, ke ringkasan"
            className="flex items-center gap-2"
          >
            <Image
              src={siteConfig.logo.src}
              alt={siteConfig.logo.alt}
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
              loading="eager"
              sizes="96px"
              className="h-9 w-auto"
            />
            <span className="text-xs font-semibold tracking-wide text-subtle-foreground uppercase">
              Panel CMS
            </span>
          </Link>
          <Suspense fallback={<div className="order-last h-11 w-full sm:order-none sm:w-64" />}>
            <CmsNav />
          </Suspense>
          <div className="ml-auto">
            <Suspense fallback={null}>
              <CmsUserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <main id="konten" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
