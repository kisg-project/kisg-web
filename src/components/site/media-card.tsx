import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

/**
 * Kartu konten (proyek, berita, promo): foto yang memperbesar halus saat di-hover, kartu naik sedikit.
 * Seluruh kartu bisa diklik lewat tautan judul (pseudo-element), tanpa tautan bersarang.
 */
export function MediaCard({
  href,
  title,
  image,
  meta,
  badge,
  children,
}: {
  href: string;
  title: string;
  image: { src: string; alt: string } | null;
  meta?: ReactNode;
  /** Label di pojok foto, misal "Sold out". */
  badge?: string;
  children?: ReactNode;
}) {
  return (
    <article className="group relative flex h-full lift flex-col overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}
        {badge ? (
          <span className="absolute top-3 left-3 rounded-md bg-primary-950/85 px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {meta ? <p className="text-xs font-semibold text-muted-foreground">{meta}</p> : null}
        <h3 className="text-lg font-bold">
          <Link
            href={href}
            className="group-hover:text-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>
        {children ? <div className="text-sm text-subtle-foreground">{children}</div> : null}
      </div>
    </article>
  );
}
