import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/site/page-hero";
import { CAREER_LEVELS } from "@/config/careers";
import { CareerList, getOpenCareers } from "@/features/cms";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export const metadata: Metadata = pageMetadata({
  path: "/karir",
  title: "Karir",
  description:
    "Karir di KIS Group, developer perumahan di Bekasi: jenjang berpengalaman, lulusan baru, staf lapangan, dan magang.",
});

export default async function CareersPage() {
  const careers = await getOpenCareers();
  const countFor = (level: string) => careers.filter((career) => career.level === level).length;

  return (
    <>
      <PageHero
        title="Karir"
        description="Pilih jenjang yang sesuai dengan pengalaman Anda, lalu lihat lowongan yang sedang dibuka."
        crumbs={[{ name: "Karir", path: "/karir" }]}
      />
      <Section title="Jenjang posisi">
        <ul aria-label="Jenjang posisi" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAREER_LEVELS.map((item, index) => {
            const count = countFor(item.level);
            return (
              <li key={item.level}>
                <Reveal delay={index * 80} className="h-full">
                  <Link
                    href={`/karir/jenjang/${item.slug}`}
                    className="group flex h-full lift flex-col overflow-hidden rounded-3xl border border-primary-100 bg-card shadow-xs"
                  >
                    <span className="relative block aspect-[4/5] overflow-hidden bg-surface">
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </span>
                    <span className="flex flex-1 flex-col gap-2 p-5">
                      <span className="text-xl font-bold text-primary-800">{item.title}</span>
                      <span className="text-sm text-subtle-foreground">{item.description}</span>
                      <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-primary">
                        {count > 0 ? `${String(count)} lowongan dibuka` : "Lihat jenjang"}
                        <Icon icon={ArrowRight02Icon} aria-hidden="true" className="size-4" />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Section>
      {careers.length > 0 ? (
        <Section title="Semua lowongan" className="pt-0">
          <CareerList careers={careers} />
        </Section>
      ) : null}
    </>
  );
}
