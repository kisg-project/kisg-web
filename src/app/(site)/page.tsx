import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-message";
import { MediaCard } from "@/components/site/media-card";
import { Button } from "@/components/ui/button";
import { siteConfig, whatsappLink } from "@/config/site";
import { env } from "@/env";
import {
  getActiveBanners,
  getActivePromos,
  getHomeStats,
  getPublishedPosts,
  HeroBanner,
  StatsStrip,
} from "@/features/cms";
import { KprTeaser } from "@/features/kpr";
import {
  formatAddress,
  getFeaturedProject,
  lowestPrice,
  shortArea,
  UnitHighlights,
  type ProjectDetail,
} from "@/features/projects";
import { formatDateWIB, formatRupiah, formatRupiahRange } from "@/lib/format";
import { jsonLdGraph, listingJsonLd, organizationJsonLd } from "@/lib/seo/structured-data";

const OG_FALLBACK = "/images/hero/sgv-hero-desktop.webp";

function describe(project: ProjectDetail | null): string {
  if (!project) return `${siteConfig.legalName}, developer perumahan di Kabupaten Bekasi.`;
  const unit = project.unitTypes[0];
  const area = shortArea(project.address);
  const parts = [
    `${project.name}${area ? ` di ${area}` : ""}${project.address.city ? `, ${project.address.city}` : ""}.`,
  ];
  if (unit) {
    parts.push(
      `Rumah ${unit.name}, ${String(unit.bedrooms)} kamar tidur, ${String(unit.bathrooms)} kamar mandi.`,
    );
    if (unit.price !== null) parts.push(`Harga ${formatRupiah(unit.price)}.`);
  }
  return parts.join(" ").slice(0, 160);
}

export async function generateMetadata(): Promise<Metadata> {
  const project = await getFeaturedProject();
  const description = describe(project);
  const title = project
    ? `${project.name}${shortArea(project.address) ? `, ${shortArea(project.address) ?? ""}` : ""}`
    : siteConfig.name;
  const image = project?.cover;
  const images = image
    ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }]
    : [{ url: OG_FALLBACK }];
  return {
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/",
      siteName: siteConfig.name,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

function mapsUrl(project: ProjectDetail): string {
  const query =
    project.lat !== null && project.lng !== null
      ? `${String(project.lat)},${String(project.lng)}`
      : `${project.name}, ${formatAddress(project.address)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default async function HomePage() {
  const [banners, project, promos, posts, stats] = await Promise.all([
    getActiveBanners(),
    getFeaturedProject(),
    getActivePromos(),
    getPublishedPosts(3),
    getHomeStats(),
  ]);
  const firstUnit = project?.unitTypes[0];
  const projectPath = project ? `/proyek/${project.slug}` : "/";

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          organizationJsonLd(env.NEXT_PUBLIC_SITE_URL),
          ...(project && firstUnit
            ? [
                listingJsonLd(env.NEXT_PUBLIC_SITE_URL, {
                  name: project.name,
                  path: projectPath,
                  address: project.address,
                  imagePaths: project.gallery.slice(0, 4).map((image) => image.src),
                  unit: firstUnit,
                }),
              ]
            : []),
        ])}
      />
      <HeroBanner
        banners={banners}
        project={
          project
            ? {
                name: project.name,
                area: shortArea(project.address),
                lowestPrice: lowestPrice(project.unitTypes),
              }
            : null
        }
      />
      <StatsStrip stats={stats} />

      {project ? (
        <>
          <Section id="sorotan" title="Sorotan proyek" className="scroll-mt-(--header-height)">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <Reveal className="lg:col-span-5">
                <h3 className="text-2xl font-bold">{project.name}</h3>
                <p className="mt-3 flex gap-2 text-subtle-foreground">
                  <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  {formatAddress(project.address)}
                </p>
                {lowestPrice(project.unitTypes) ? (
                  <p className="mt-4 text-lg font-bold text-highlight-text">
                    Mulai {formatRupiahRange(lowestPrice(project.unitTypes) ?? 0)}
                  </p>
                ) : null}
                <Button asChild className="mt-6">
                  <Link href={projectPath}>
                    Lihat detail proyek
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </Reveal>
              {project.gallery.length > 0 ? (
                <ul
                  className="grid grid-cols-2 gap-3 lg:col-span-7"
                  aria-label={`Foto ${project.name}`}
                >
                  {project.gallery.slice(0, 4).map((image, index) => (
                    <li key={image.id}>
                      <Reveal delay={index * 80}>
                        <Link
                          href={`${projectPath}#galeri`}
                          className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface"
                        >
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(min-width: 1024px) 28vw, 50vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        </Link>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Section>

          <Section id="tipe-unit" tone="surface" className="scroll-mt-(--header-height)">
            <div className="grid gap-6">
              {project.unitTypes.map((unitType, index) => (
                <Reveal key={unitType.id} delay={index * 80}>
                  <UnitHighlights unitType={unitType} nearby={project.nearby} />
                </Reveal>
              ))}
            </div>
          </Section>

          {firstUnit?.price ? (
            <Section
              id="simulasi-kpr"
              title="Simulasi KPR"
              description="KPR konvensional dan KPR syariah dari bank rekanan. Hitung angsuran, rincian biaya, dan jadwal, lalu unduh PDF."
              className="scroll-mt-(--header-height)"
            >
              <Reveal>
                <KprTeaser price={firstUnit.price} />
              </Reveal>
            </Section>
          ) : null}

          <Section id="lokasi" title="Lokasi" className="scroll-mt-(--header-height)">
            <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="flex max-w-2xl gap-3 text-base">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">{project.name}</span>
                  {formatAddress(project.address)}
                </span>
              </p>
              <Button asChild variant="outline">
                <a href={mapsUrl(project)} target="_blank" rel="noopener noreferrer">
                  Buka di Google Maps
                </a>
              </Button>
            </Reveal>
          </Section>
        </>
      ) : (
        <Section id="proyek" title="Proyek">
          <EmptyState
            title="Informasi proyek sedang disiapkan."
            description="Hubungi marketing lewat WhatsApp untuk info terbaru."
          />
        </Section>
      )}

      {promos.length > 0 ? (
        <Section id="promo" tone="surface" title="Promo berlaku">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promos.slice(0, 3).map((promo, index) => (
              <li key={promo.id}>
                <Reveal delay={index * 80} className="h-full">
                  <MediaCard
                    href={`/promo/${promo.slug}`}
                    title={promo.title}
                    image={promo.cover}
                    meta={
                      promo.endsAt ? `Berlaku sampai ${formatDateWIB(promo.endsAt)}` : undefined
                    }
                  >
                    {promo.summary}
                  </MediaCard>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {posts.length > 0 ? (
        <Section id="berita" title="Berita terbaru">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <li key={post.id}>
                <Reveal delay={index * 80} className="h-full">
                  <MediaCard
                    href={`/berita/${post.slug}`}
                    title={post.title}
                    image={post.cover}
                    meta={
                      <time dateTime={post.publishedAt}>{formatDateWIB(post.publishedAt)}</time>
                    }
                  >
                    {post.excerpt}
                  </MediaCard>
                </Reveal>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-8">
            <Link href="/berita">Semua berita</Link>
          </Button>
        </Section>
      ) : null}

      <section aria-labelledby="cta-judul" className="bg-primary-900 py-12 text-white sm:py-16">
        <Reveal className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 id="cta-judul" className="text-2xl font-bold sm:text-3xl">
              Jadwalkan survei lokasi
            </h2>
            <p className="mt-2 text-primary-100">
              Marketing kami mengatur jadwal kunjungan
              {project ? ` ke ${project.name}` : ""}.
            </p>
          </div>
          <Button asChild variant="highlight" size="lg">
            <a
              href={whatsappLink(
                project
                  ? `Halo, saya ingin jadwal survei ke ${project.name}.`
                  : "Halo, saya ingin jadwal survei.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone aria-hidden="true" />
              Atur jadwal survei
            </a>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
