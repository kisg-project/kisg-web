import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/config/site";
import { env } from "@/env";
import { KprTeaser } from "@/features/kpr";
import {
  ConstructionUpdates,
  FaqList,
  formatAddress,
  getProjectBySlug,
  lowestPrice,
  ProjectGallery,
  shortArea,
  UnitHighlights,
  type ProjectDetail,
} from "@/features/projects";
import { formatRupiah, formatRupiahRange } from "@/lib/format";
import { faqJsonLd, jsonLdGraph, listingJsonLd } from "@/lib/seo/structured-data";

const STATUS_LABEL: Record<ProjectDetail["status"], string> = {
  segera: "Segera hadir",
  tersedia: "Unit tersedia",
  sold_out: "Terjual habis",
};

function describe(project: ProjectDetail): string {
  const unit = project.unitTypes[0];
  const parts = [`${project.name}, ${formatAddress(project.address)}.`];
  if (unit) {
    parts.push(`Rumah ${unit.name}, ${String(unit.bedrooms)} kamar tidur.`);
    if (unit.price !== null) parts.push(`Harga ${formatRupiah(unit.price)}.`);
  }
  const text = parts.join(" ");
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

export async function generateMetadata({ params }: PageProps<"/proyek/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Proyek tidak ditemukan", robots: { index: false } };
  const description = describe(project);
  const path = `/proyek/${project.slug}`;
  const image = project.cover;
  const images = image
    ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }]
    : [];
  return {
    title: project.name,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title: project.name, description, images },
    twitter: {
      card: "summary_large_image",
      title: project.name,
      description,
      images: images.map((i) => i.url),
    },
  };
}

function mapsUrl(project: ProjectDetail): string {
  const query =
    project.lat !== null && project.lng !== null
      ? `${String(project.lat)},${String(project.lng)}`
      : `${project.name}, ${formatAddress(project.address)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default async function ProjectPage({ params }: PageProps<"/proyek/[slug]">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const path = `/proyek/${project.slug}`;
  const firstUnit = project.unitTypes[0];
  const fromPrice = lowestPrice(project.unitTypes);
  const area = shortArea(project.address);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          ...(firstUnit
            ? [
                listingJsonLd(env.NEXT_PUBLIC_SITE_URL, {
                  name: project.name,
                  path,
                  address: project.address,
                  imagePaths: project.gallery.slice(0, 4).map((image) => image.src),
                  unit: firstUnit,
                }),
              ]
            : []),
          ...(project.faqs.length > 0 ? [faqJsonLd(project.faqs)] : []),
        ])}
      />
      <PageHero
        title={project.name}
        description={
          project.tagline ??
          (area ? `Perumahan di ${area}, ${project.address.city ?? ""}`.trim() : undefined)
        }
        crumbs={[
          { name: "Proyek", path: "/proyek" },
          { name: project.name, path },
        ]}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold">
            {STATUS_LABEL[project.status]}
          </span>
          {fromPrice ? (
            <span className="rounded-md bg-highlight px-3 py-1.5 text-sm font-bold text-highlight-foreground">
              Mulai {formatRupiahRange(fromPrice)}
            </span>
          ) : null}
        </div>
      </PageHero>

      {project.gallery.length > 0 ? (
        <Section id="galeri" title="Galeri" className="scroll-mt-(--header-height)">
          <Reveal>
            <ProjectGallery images={project.gallery} projectName={project.name} />
          </Reveal>
        </Section>
      ) : null}

      {project.unitTypes.length > 0 ? (
        <Section
          id="tipe-unit"
          tone="surface"
          title="Tipe unit"
          className="scroll-mt-(--header-height)"
        >
          <div className="grid gap-6">
            {project.unitTypes.map((unitType, index) => (
              <Reveal key={unitType.id} delay={index * 80}>
                <UnitHighlights unitType={unitType} nearby={project.nearby} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {firstUnit?.price ? (
        <Section
          id="simulasi-kpr"
          title="Simulasi KPR"
          description="Hitung angsuran KPR konvensional atau syariah untuk unit ini."
          className="scroll-mt-(--header-height)"
        >
          <Reveal>
            <KprTeaser price={firstUnit.price} />
          </Reveal>
        </Section>
      ) : null}

      <Section id="lokasi" tone="surface" title="Lokasi" className="scroll-mt-(--header-height)">
        <Reveal className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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

      {project.updates.length > 0 ? (
        <Section id="progres" title="Progres pembangunan" className="scroll-mt-(--header-height)">
          <ConstructionUpdates items={project.updates} />
        </Section>
      ) : null}

      {project.faqs.length > 0 ? (
        <Section id="faq" title="Pertanyaan umum" className="scroll-mt-(--header-height)">
          <Reveal className="max-w-3xl">
            <FaqList items={project.faqs} />
          </Reveal>
        </Section>
      ) : null}

      <section aria-labelledby="cta-proyek" className="bg-primary-900 py-12 text-white sm:py-16">
        <Reveal className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 id="cta-proyek" className="text-2xl font-bold sm:text-3xl">
              Tertarik dengan {project.name}?
            </h2>
            <p className="mt-2 text-primary-100">
              Tanya unit tersedia, simulasi cicilan, atau jadwal survei lewat WhatsApp.
            </p>
          </div>
          <Button asChild variant="highlight" size="lg">
            <a
              href={whatsappLink(`Halo, saya ingin info ${project.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone aria-hidden="true" />
              Hubungi marketing
            </a>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
