import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal } from "@/components/shared/reveal";
import { RoofLine } from "@/components/shared/roof-line";
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
import { pageMetadata } from "@/lib/seo/page-metadata";
import {
  jsonLdGraph,
  listingJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";
import {
  ArrowRight02Icon,
  ArrowUpRight01Icon,
  Call02Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

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
  return pageMetadata({ path: "/", description: describe(await getFeaturedProject()) });
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

  const bannerImages = new Set(banners.flatMap((banner) => [banner.image, banner.mobileImage]));
  const homeGallery = (project?.gallery ?? [])
    .filter((image) => !bannerImages.has(image.src))
    .slice(0, 4);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          organizationJsonLd(env.NEXT_PUBLIC_SITE_URL),
          websiteJsonLd(env.NEXT_PUBLIC_SITE_URL),
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
          <Section
            id="sorotan"
            title="Proyek unggulan"
            description="Rumah yang sedang dipasarkan, lengkap dengan harga dan spesifikasi."
            className="scroll-mt-(--header-height)"
          >
            <div className="grid gap-8 rounded-4xl bg-surface p-5 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:p-10">
              <Reveal className="lg:col-span-5">
                <h3 className="text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">
                  {project.name}
                </h3>
                <p className="mt-4 flex gap-2 text-subtle-foreground">
                  <Icon
                    icon={Location01Icon}
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                  />
                  {formatAddress(project.address)}
                </p>
                {lowestPrice(project.unitTypes) ? (
                  <p className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-lg font-extrabold text-highlight-text shadow-xs ring-1 ring-gold-200">
                    Mulai {formatRupiahRange(lowestPrice(project.unitTypes) ?? 0)}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href={projectPath}>
                      Lihat detail proyek
                      <Icon icon={ArrowRight02Icon} aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-primary-200 bg-white hover:bg-primary-50"
                  >
                    <Link href="/simulasi-kpr">Hitung cicilan</Link>
                  </Button>
                </div>
              </Reveal>
              {homeGallery.length > 0 ? (
                <ul
                  className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7"
                  aria-label={`Foto ${project.name}`}
                >
                  {homeGallery.map((image, index) => (
                    <li key={image.id}>
                      <Reveal delay={index * 80}>
                        <Link
                          href={`${projectPath}#galeri`}
                          className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-primary-100"
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

          <Section
            id="lokasi"
            title="Lokasi"
            description="Alamat proyek dan tempat penting di sekitarnya."
            tone="surface"
            className="scroll-mt-(--header-height)"
          >
            <Reveal className="grid gap-6 rounded-4xl bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-10">
              <div className="lg:col-span-5">
                <p className="flex gap-3 text-base">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon icon={Location01Icon} aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block text-lg font-bold text-primary-950">{project.name}</span>
                    <span className="text-subtle-foreground">{formatAddress(project.address)}</span>
                  </span>
                </p>
                <Button asChild variant="outline" className="mt-6 border-primary-200">
                  <a href={mapsUrl(project)} target="_blank" rel="noopener noreferrer">
                    Buka di Google Maps
                    <Icon icon={ArrowUpRight01Icon} aria-hidden="true" />
                  </a>
                </Button>
              </div>
              {project.nearby.length > 0 ? (
                <ul aria-label="Tempat terdekat" className="flex flex-wrap gap-2.5 lg:col-span-7">
                  {project.nearby.map((place) => (
                    <li
                      key={place.id}
                      className="rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-primary-900"
                    >
                      {place.name}
                      {place.travelMinutes !== null ? (
                        <span className="font-medium text-subtle-foreground">
                          {` ${String(place.travelMinutes)} menit`}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
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
        <Section
          id="berita"
          title="Berita terbaru"
          description="Kabar KPR, kebijakan perumahan, dan panduan membeli rumah."
          action={
            <Button asChild variant="outline" className="border-primary-200">
              <Link href="/berita">
                Semua berita
                <Icon icon={ArrowRight02Icon} aria-hidden="true" />
              </Link>
            </Button>
          }
        >
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
        </Section>
      ) : null}

      <section aria-labelledby="cta-judul" className="px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <Reveal className="relative isolate mx-auto flex w-full max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-4xl bg-primary-900 px-6 py-10 text-white sm:px-10 sm:py-14 md:flex-row md:items-center md:justify-between lg:px-14">
          <RoofLine
            strokeWidth={4}
            className="absolute -right-24 -bottom-16 -z-10 h-32 w-[26rem] text-gold-400/25"
          />
          <div className="max-w-xl">
            <h2 id="cta-judul" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Jadwalkan survei lokasi
            </h2>
            <p className="mt-3 text-lg text-primary-100">
              Lihat rumah contoh dan lingkungannya langsung. Marketing kami mengatur jadwal
              kunjungan
              {project ? ` ke ${project.name}` : ""}.
            </p>
          </div>
          <Button asChild variant="highlight" size="lg" className="shadow-lg">
            <a
              href={whatsappLink(
                project
                  ? `Halo, saya ingin jadwal survei ke ${project.name}.`
                  : "Halo, saya ingin jadwal survei.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon={Call02Icon} aria-hidden="true" />
              Atur jadwal survei
            </a>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
