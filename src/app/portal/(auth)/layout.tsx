import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="konten"
      className="flex flex-1 items-center justify-center bg-surface px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]"
    >
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm sm:p-8">
        <Image
          src={siteConfig.logo.src}
          alt={siteConfig.logo.alt}
          width={siteConfig.logo.width}
          height={siteConfig.logo.height}
          loading="eager"
          sizes="128px"
          className="mx-auto h-12 w-auto"
        />
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
