import type { Metadata } from "next";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-message";
import { MediaCard } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { formatAddress, getPublishedProjects, lowestPrice } from "@/features/projects";
import { formatRupiahRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Proyek",
  description:
    "Proyek perumahan KIS Group di Kabupaten Bekasi: tipe unit, harga, lokasi, dan progres pembangunan.",
  alternates: { canonical: "/proyek" },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();
  return (
    <>
      <PageHero
        title="Proyek"
        description="Perumahan yang sedang dipasarkan KIS Group."
        crumbs={[{ name: "Proyek", path: "/proyek" }]}
      />
      <Section>
        {projects.length === 0 ? (
          <EmptyState
            title="Belum ada proyek yang ditampilkan."
            description="Hubungi marketing lewat WhatsApp untuk info proyek terbaru."
          />
        ) : (
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
                      meta={price ? `Mulai ${formatRupiahRange(price)}` : "Hubungi marketing"}
                    >
                      {formatAddress(project.address)}
                    </MediaCard>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
