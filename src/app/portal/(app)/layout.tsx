import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { siteConfig } from "@/config/site";
import { InstallButton } from "@/features/pwa";
import { StickyHeader } from "./_components/portal-nav";
import {
  BottomNavForUser,
  DrawerForUser,
  SidebarNavForUser,
  UserMenu,
} from "./_components/portal-shell-parts";

export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-feel portal-field portal-canvas flex min-h-dvh flex-col text-sm">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={null}>
        <SidebarNavForUser />
      </Suspense>
      <StickyHeader>
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:pl-[6rem]">
          <div className="flex items-center gap-2.5">
            <Suspense fallback={<span aria-hidden="true" className="size-10 lg:hidden" />}>
              <DrawerForUser />
            </Suspense>
            <Link
              href="/portal"
              aria-label="Portal KIS Group, ke beranda portal"
              className="inline-flex items-center"
            >
              <Image
                src={siteConfig.logo.src}
                alt={siteConfig.logo.alt}
                width={siteConfig.logo.width}
                height={siteConfig.logo.height}
                loading="eager"
                sizes="96px"
                className="h-7 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <InstallButton />
            <Suspense
              fallback={<span aria-hidden="true" className="size-10 rounded-full bg-neutral-100" />}
            >
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </StickyHeader>
      <main
        id="konten"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pt-4 pb-28 sm:px-6 lg:pb-12 lg:pl-[6rem]"
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNavForUser />
      </Suspense>
    </div>
  );
}
