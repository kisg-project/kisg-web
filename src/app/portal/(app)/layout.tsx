import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { siteConfig } from "@/config/site";
import { InstallButton } from "@/features/pwa";
import { StickyHeader } from "./_components/portal-nav";
import { BottomNavForUser, SidebarNavForUser, UserMenu } from "./_components/portal-shell-parts";

function PortalBrand() {
  return (
    <Link
      href="/portal"
      aria-label="Portal KIS Group, ke beranda portal"
      className="inline-flex min-h-11 items-center rounded-full"
    >
      <Image
        src={siteConfig.logo.src}
        alt={siteConfig.logo.alt}
        width={siteConfig.logo.width}
        height={siteConfig.logo.height}
        loading="eager"
        sizes="112px"
        className="h-8 w-auto"
      />
    </Link>
  );
}

/**
 * Kerangka aplikasi portal gaya PWA (keputusan owner, 21 November 2026, mengikuti Shaflow): header
 * lengket yang buram saat digulir, menu pil melayang di bawah (HP) atau rel melayang di kiri (desktop).
 */
export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-feel portal-field portal-canvas flex min-h-dvh flex-col">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={null}>
        <SidebarNavForUser />
      </Suspense>
      <StickyHeader>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:pl-32">
          <PortalBrand />
          <div className="flex items-center gap-2">
            <InstallButton />
            <Suspense
              fallback={<span aria-hidden="true" className="size-11 rounded-full bg-primary-50" />}
            >
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </StickyHeader>
      <main
        id="konten"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-2 pb-32 sm:px-6 lg:pb-14 lg:pl-32"
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNavForUser />
      </Suspense>
    </div>
  );
}
