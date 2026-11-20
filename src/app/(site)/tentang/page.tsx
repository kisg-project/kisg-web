import type { Metadata } from "next";
import {
  Building2,
  CalendarDays,
  Handshake,
  House,
  MapPin,
  MessageSquareText,
  Phone,
} from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { MediaCard } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";
import { formatAddress, getPublishedProjects, lowestPrice } from "@/features/projects";
import { formatRupiahRange } from "@/lib/format";

const SERVICE_ICONS = [House, Handshake, MessageSquareText] as const;

export const metadata: Metadata = {
  title: "Tentang KIS Group",
  description: `${siteConfig.legalName}, developer perumahan di Bekasi. Profil, proyek, dan kontak kantor pemasaran.`,
  alternates: { canonical: "/tentang" },
};

// Isi dari Company Profile PT KISG (2024) dan data owner. Legalitas ditambah saat datanya ada
// (docs/TODO-DATA.md bagian 2). Proyek lama tidak disebut (keputusan owner, Fase 1).
export default async function AboutPage() {
  const projects = await getPublishedProjects();
  const { company } = siteConfig;
  const facts = [
    { icon: Building2, label: "Badan usaha", value: siteConfig.legalName },
    { icon: CalendarDays, label: "Berdiri", value: String(company.foundedYear) },
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
        <Reveal className="mb-8 grid max-w-3xl gap-3 text-base leading-relaxed">
          {company.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((fact, index) => (
            <Reveal
              key={fact.label}
              delay={index * 80}
              className="flex h-full lift flex-col gap-2 rounded-lg border bg-card p-5"
            >
              <dt className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <span className="icon-chip flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                  <fact.icon aria-hidden="true" className="size-5" />
                </span>
                {fact.label}
              </dt>
              <dd className="font-semibold">{fact.value}</dd>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section tone="surface" title="Visi dan misi">
        <div className="grid gap-6 lg:grid-cols-12">
          <Reveal className="lift rounded-lg border bg-card p-6 lg:col-span-5">
            <h3 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Visi
            </h3>
            <p className="mt-3 text-lg leading-relaxed font-semibold">{company.vision}</p>
          </Reveal>
          <Reveal delay={80} className="lift rounded-lg border bg-card p-6 lg:col-span-7">
            <h3 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Misi
            </h3>
            <ol className="mt-3 grid gap-3">
              {company.missions.map((mission, index) => (
                <li key={mission} className="flex gap-3">
                  <span className="icon-chip flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-50 text-sm font-bold text-primary-700 tabular">
                    {index + 1}
                  </span>
                  <span>{mission}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Section>

      <Section title="Layanan">
        <ul className="grid gap-4 sm:grid-cols-3">
          {company.services.map((service, index) => {
            const Icon = SERVICE_ICONS[index] ?? House;
            return (
              <li key={service.title}>
                <Reveal
                  delay={index * 80}
                  className="flex h-full lift flex-col gap-3 rounded-lg border bg-card p-5"
                >
                  <span className="icon-chip flex size-11 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="text-lg font-bold">{service.title}</h3>
                  <p className="text-sm text-subtle-foreground">{service.body}</p>
                </Reveal>
              </li>
            );
          })}
        </ul>
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
            aria-label={`Instagram ${siteConfig.instagram.handle}`}
            className="inline-flex min-h-11 lift items-center gap-2 rounded-md border bg-card px-4 font-semibold"
          >
            <InstagramIcon aria-hidden="true" className="size-4 text-primary" />
            {siteConfig.instagram.handle}
          </a>
        </Reveal>
      </Section>
    </>
  );
}
