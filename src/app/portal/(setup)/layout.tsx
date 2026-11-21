import Image from "next/image";
import { siteConfig } from "@/config/site";

/** Layout aktivasi akun: satu tugas di layar, tanpa menu portal. */
export default function PortalSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="konten"
      className="flex flex-1 justify-center bg-surface px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <div className="w-full max-w-lg self-start rounded-lg border bg-background p-6 shadow-sm sm:p-8">
        <Image
          src={siteConfig.logo.src}
          alt={siteConfig.logo.alt}
          width={siteConfig.logo.width}
          height={siteConfig.logo.height}
          loading="eager"
          sizes="128px"
          className="h-12 w-auto"
        />
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
