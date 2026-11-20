import type { Metadata } from "next";
import { Building2, MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { MediaCard } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";
import { formatAddress, getPublishedProjects, lowestPrice } from "@/features/projects";
import { formatRupiahRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tentang KIS Group",
  description: `${siteConfig.legalName}, developer perumahan di Bekasi. Profil, proyek, dan kontak kantor pemasaran.`,
  alternates: { canonical: "/tentang" },
};

// Hanya fakta yang sudah dikonfirmasi owner. Profil lengkap, visi misi, dan legalitas ditambah saat
// datanya ada (docs/TODO-DATA.md bagian 1 dan 2). Tidak ada kalimat pengisi.
export default async function AboutPage() {
  const projects = await getPublishedProjects();
  const facts = [
    { icon: Building2, label: "Badan usaha", value: siteConfig.legalName },
    { icon: MapPin, label: "Kantor pemasaran", value: formatOfficeAddress() },
  ];

  return (
    <>
      <PageHero
        title="Tentang KIS Group"
        description="Developer perumahan di Kabupaten Bekasi."
        crumbs={[{ name: "Tentang", path: "/tentang" }]}
      />

      <Section title="Profil singkat">
        <dl className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact, index) => (
            <Reveal
              key={fact.label}
              delay={index * 80}
              className="flex h-full flex-col gap-2 rounded-lg border bg-card p-5"
            >
              <dt className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                  <fact.icon aria-hidden="true" className="size-5" />
                </span>
                {fact.label}
              </dt>
              <dd className="font-semibold">{fact.value}</dd>
            </Reveal>
          ))}
        </dl>
      </Section>

      {projects.length > 0 ? (
        <Section tone="surface" title="Proyek">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const price = lowestPrice(project.unitTypes);
              return (
                <li key={project.id}>
                  <Reveal delay={index * 80} className="h-full">
                    <MediaCard
                      href={`/proyek/${project.slug}`}
                      title={project.name}
                      image={project.cover}
                      meta={price ? `Mulai ${formatRupiahRange(price)}` : undefined}
                    >
                      {formatAddress(project.address)}
                    </MediaCard>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section title="Hubungi kami">
        <Reveal className="flex flex-wrap gap-3">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 lift items-center gap-2 rounded-md border bg-card px-4 font-semibold"
          >
            <Phone aria-hidden="true" className="size-4 text-primary" />
            WhatsApp {siteConfig.whatsapp.display}
          </a>
          <a
            href={siteConfig.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 lift items-center gap-2 rounded-md border bg-card px-4 font-semibold"
          >
            <InstagramIcon aria-hidden="true" className="size-4 text-primary" />
            Instagram {siteConfig.instagram.handle}
          </a>
        </Reveal>
      </Section>
    </>
  );
}
