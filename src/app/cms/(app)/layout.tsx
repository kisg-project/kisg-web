import { Suspense } from "react";
import { StickyHeader } from "@/components/shared/app-nav";
import { CmsBottomNav, CmsSidebar } from "./_components/cms-nav";
import { CmsGreeting, CmsUserMenu } from "./_components/cms-shell";

export default function CmsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-feel portal-field portal-canvas portal-shell flex min-h-dvh flex-col text-sm lg:pl-(--rail-w)">
      <CmsSidebar />
      <StickyHeader>
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Suspense fallback={null}>
              <CmsGreeting />
            </Suspense>
          </div>
          <CmsUserMenu />
        </div>
      </StickyHeader>
      <main
        id="konten"
        className="flex w-full flex-1 flex-col gap-5 px-4 pt-4 pb-28 lg:px-6 lg:pb-12"
      >
        {children}
      </main>
      <CmsBottomNav />
    </div>
  );
}
