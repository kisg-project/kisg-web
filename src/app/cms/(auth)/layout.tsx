import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function CmsAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="konten"
      className="flex flex-1 items-center justify-center bg-surface px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]"
    >
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-2">
          <Image
            src={siteConfig.logo.src}
            alt={siteConfig.logo.alt}
            width={siteConfig.logo.width}
            height={siteConfig.logo.height}
            loading="eager"
            sizes="128px"
            className="h-12 w-auto"
          />
          <p className="text-xs font-semibold tracking-wide text-subtle-foreground uppercase">
            Panel CMS
          </p>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
