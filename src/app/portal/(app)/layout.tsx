import { Suspense } from "react";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { InstallButton } from "@/features/pwa";
import { StickyHeader } from "./_components/portal-nav";
import {
  BottomNavForUser,
  HeaderGreeting,
  SidebarNavForUser,
  UserMenu,
} from "./_components/portal-shell-parts";

export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-feel portal-field portal-canvas portal-shell flex min-h-dvh flex-col text-sm lg:pl-(--rail-w)">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Suspense fallback={null}>
        <SidebarNavForUser />
      </Suspense>
      <StickyHeader>
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Suspense fallback={null}>
              <HeaderGreeting />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <InstallButton />
            <Suspense
              fallback={<span aria-hidden="true" className="size-9 rounded-lg bg-neutral-100" />}
            >
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </StickyHeader>
      <main
        id="konten"
        className="flex w-full flex-1 flex-col gap-5 px-4 pt-4 pb-28 lg:px-6 lg:pb-12"
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNavForUser />
      </Suspense>
    </div>
  );
}
