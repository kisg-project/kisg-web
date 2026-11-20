import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { InstallButton } from "@/features/pwa";
import { BottomNavForUser, SidebarNavForUser, UserMenu } from "./_components/portal-shell-parts";

function PortalBrand() {
  return (
    <Link href="/portal" aria-label="Portal KIS Group, ke beranda portal" className="inline-flex">
      <Image
        src={siteConfig.logo.src}
        alt={siteConfig.logo.alt}
        width={siteConfig.logo.width}
        height={siteConfig.logo.height}
        loading="eager"
        sizes="112px"
        className="h-10 w-auto"
      />
    </Link>
  );
}

export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-surface lg:flex">
        <div className="flex h-16 items-center px-6">
          <PortalBrand />
        </div>
        <Suspense fallback={null}>
          <SidebarNavForUser />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b bg-background px-4 pt-[env(safe-area-inset-top)] sm:px-6">
          <div className="lg:hidden">
            <PortalBrand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <InstallButton />
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <main id="konten" className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <BottomNavForUser />
      </Suspense>
    </div>
  );
}
