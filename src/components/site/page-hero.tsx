import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { JsonLd } from "@/components/shared/json-ld";
import { env } from "@/env";
import { breadcrumbJsonLd, jsonLdGraph, type Crumb } from "@/lib/seo/structured-data";

/**
 * Judul halaman dalam (bukan beranda): jejak halaman, h1, dan deskripsi singkat di pita hijau gelap.
 * Jejak halaman juga dikirim sebagai JSON-LD BreadcrumbList. Item terakhir adalah halaman ini.
 */
export function PageHero({
  title,
  description,
  crumbs,
  children,
}: {
  title: string;
  description?: ReactNode;
  crumbs: readonly Crumb[];
  children?: ReactNode;
}) {
  const trail: Crumb[] = [{ name: "Beranda", path: "/" }, ...crumbs];
  return (
    <section className="bg-primary-900 text-white">
      <JsonLd data={jsonLdGraph([breadcrumbJsonLd(env.NEXT_PUBLIC_SITE_URL, trail)])} />
      <Container className="py-10 sm:py-14">
        <nav aria-label="Jejak halaman">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-primary-100">
            {trail.map((crumb, index) => {
              const last = index === trail.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1">
                  {last ? (
                    <span aria-current="page" className="font-semibold text-white">
                      {crumb.name}
                    </span>
                  ) : (
                    <>
                      <Link href={crumb.path} className="underline-offset-4 hover:underline">
                        {crumb.name}
                      </Link>
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <span aria-hidden="true" className="mt-4 block h-1 w-12 rounded-sm bg-highlight" />
        {description ? (
          <p className="mt-4 max-w-2xl text-base text-primary-100 sm:text-lg">{description}</p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
