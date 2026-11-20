import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { siteConfig, whatsappLink } from "@/config/site";
import { env } from "@/env";
import { getActiveBanners, HeroBanner } from "@/features/cms";
import { KprTeaser } from "@/features/kpr";
import {
  formatAddress,
  getFeaturedProject,
  lowestPrice,
  shortArea,
  UnitHighlights,
  type ProjectDetail,
} from "@/features/projects";
import { formatRupiah } from "@/lib/format";
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
  const [banners, project] = await Promise.all([getActiveBanners(), getFeaturedProject()]);
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

      {project ? (
        <>
          <Section id="tipe-unit" className="scroll-mt-(--header-height)">
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
              tone="surface"
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
