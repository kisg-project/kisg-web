import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/state-message";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { CAREER_LEVELS, careerLevelBySlug } from "@/config/careers";
import { CareerList, getOpenCareers } from "@/features/cms";
import { shareMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/karir/jenjang/[level]">): Promise<Metadata> {
  const { level } = await params;
  const info = careerLevelBySlug(level);
  if (!info) return { title: "Jenjang tidak ditemukan", robots: { index: false } };
  return shareMetadata({
    path: `/karir/jenjang/${info.slug}`,
    title: `Karir ${info.title}`,
    description: `Lowongan jenjang ${info.title.toLowerCase()} di KIS Group. ${info.description}`,
    imageAlt: `Karir ${info.title}`,
  });
}

export default async function CareerLevelPage({ params }: PageProps<"/karir/jenjang/[level]">) {
  const { level } = await params;
  const info = careerLevelBySlug(level);
  if (!info) notFound();
  const careers = (await getOpenCareers()).filter((career) => career.level === info.level);
  const others = CAREER_LEVELS.filter((item) => item.level !== info.level);
  const path = `/karir/jenjang/${info.slug}`;

  return (
    <>
      <PageHero
        title={`Karir ${info.title}`}
        description={info.description}
        crumbs={[
          { name: "Karir", path: "/karir" },
          { name: info.title, path },
        ]}
      />
      <Container className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12">
        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl bg-surface lg:col-span-4 lg:block">
          <Image
            src={info.image.src}
            alt={info.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, 0px"
            className="object-cover"
          />
        </div>
        <div className="grid content-start gap-6 lg:col-span-8">
          <h2 className="text-2xl font-bold tracking-tight">Lowongan yang dibuka</h2>
          {careers.length > 0 ? (
            <CareerList careers={careers} />
          ) : (
            <EmptyState
              title="Belum ada lowongan untuk jenjang ini."
              description="Lowongan baru akan tampil di halaman ini. Sementara itu, lihat jenjang lain yang mungkin sesuai."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {others.map((item) => (
                    <Button key={item.level} asChild variant="outline" size="sm">
                      <Link href={`/karir/jenjang/${item.slug}`}>{item.title}</Link>
                    </Button>
                  ))}
                </div>
              }
            />
          )}
        </div>
      </Container>
    </>
  );
}
