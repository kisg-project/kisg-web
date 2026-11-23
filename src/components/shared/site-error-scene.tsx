import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight01Icon,
  Building03Icon,
  Calculator01Icon,
  Call02Icon,
  News01Icon,
} from "@hugeicons/core-free-icons";
import { Container } from "@/components/shared/container";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { RoofLine } from "@/components/shared/roof-line";

const QUICK_LINKS: { href: string; label: string; icon: AppIcon }[] = [
  { href: "/proyek", label: "Proyek", icon: Building03Icon },
  { href: "/simulasi-kpr", label: "Simulasi KPR", icon: Calculator01Icon },
  { href: "/berita", label: "Berita", icon: News01Icon },
  { href: "/kontak", label: "Kontak", icon: Call02Icon },
];

export function SiteErrorScene({
  code,
  title,
  description,
  actions,
}: {
  code: "404" | "500";
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <Container className="py-10 sm:py-16">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-primary-50 px-6 py-12 text-center sm:px-12 sm:py-16 dark:bg-primary-950">
        <RoofLine className="absolute inset-x-0 top-6 mx-auto h-16 w-[min(80%,28rem)] text-primary-200 dark:text-primary-800" />
        <p
          aria-hidden="true"
          className="relative text-[5.5rem] leading-none font-extrabold tracking-tight text-primary-700 tabular-nums sm:text-[8rem] dark:text-primary-300"
        >
          {code}
        </p>
        <h1 className="relative mt-4 text-2xl font-bold text-balance sm:text-3xl">{title}</h1>
        <p className="relative mx-auto mt-3 max-w-xl text-base text-pretty text-neutral-700 dark:text-neutral-300">
          {description}
        </p>
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">{actions}</div>
      </section>
      <nav aria-label="Halaman lain" className="mt-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex min-h-14 items-center gap-3 rounded-[1.25rem] border border-border bg-card px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Icon
                  icon={item.icon}
                  className="text-primary-700 transition-colors group-hover:text-highlight-foreground dark:text-primary-300"
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <Icon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
