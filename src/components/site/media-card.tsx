import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

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
  badge?: string;
  children?: ReactNode;
}) {
  return (
    <article className="group relative flex h-full lift flex-col overflow-hidden rounded-3xl bg-card shadow-xs ring-1 ring-primary-100">
      <div className="relative m-2 mb-0 aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
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
            <Icon icon={ImageNotFound01Icon} aria-hidden="true" className="size-8" />
          </div>
        )}
        {badge ? (
          <span className="absolute top-3 left-3 rounded-full bg-primary-950/85 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        {meta ? <p className="text-xs font-semibold text-muted-foreground">{meta}</p> : null}
        <h3 className="text-lg leading-snug font-bold text-primary-950">
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
