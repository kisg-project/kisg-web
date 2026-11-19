import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Logo KIS Group yang menaut ke beranda. Lebar minimal 96px (docs/brand.md). */
export function Logo({ className, eager = false }: { className?: string; eager?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, ke beranda`}
      className={cn("inline-flex shrink-0", className)}
    >
      <Image
        src={siteConfig.logo.src}
        alt={siteConfig.logo.alt}
        width={siteConfig.logo.width}
        height={siteConfig.logo.height}
        loading={eager ? "eager" : "lazy"}
        sizes="120px"
        className="h-10 w-auto min-w-24"
      />
    </Link>
  );
}
