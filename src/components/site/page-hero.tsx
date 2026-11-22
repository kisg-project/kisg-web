import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { JsonLd } from "@/components/shared/json-ld";
import { RoofLine } from "@/components/shared/roof-line";
import { env } from "@/env";
import { breadcrumbJsonLd, jsonLdGraph, type Crumb } from "@/lib/seo/structured-data";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

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
    <section className="relative isolate overflow-hidden bg-surface text-surface-foreground">
      <JsonLd data={jsonLdGraph([breadcrumbJsonLd(env.NEXT_PUBLIC_SITE_URL, trail)])} />
      <RoofLine
        strokeWidth={3}
        className="absolute -right-24 bottom-6 -z-10 hidden h-48 w-[34rem] text-primary-200 md:block lg:right-0"
      />
      <Container className="py-10 sm:py-14 lg:py-16">
        <nav aria-label="Jejak halaman">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-subtle-foreground">
            {trail.map((crumb, index) => {
              const last = index === trail.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1">
                  {last ? (
                    <span aria-current="page" className="font-semibold text-primary-900">
                      {crumb.name}
                    </span>
                  ) : (
                    <>
                      <Link
                        href={crumb.path}
                        className="inline-flex min-h-6 items-center underline-offset-4 hover:text-primary hover:underline"
                      >
                        {crumb.name}
                      </Link>
                      <Icon icon={ArrowRight01Icon} aria-hidden="true" className="size-4" />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-balance text-primary-950 sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base text-subtle-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
