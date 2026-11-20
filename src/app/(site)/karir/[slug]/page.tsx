import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { PageHero } from "@/components/site/page-hero";
import { ContentBlocks, getCareerBySlug } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/karir/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const career = await getCareerBySlug(slug);
  if (!career) return { title: "Lowongan tidak ditemukan", robots: { index: false } };
  return {
    title: `Lowongan ${career.title}`,
    description: [career.title, career.department, career.location].filter(Boolean).join(", "),
    alternates: { canonical: `/karir/${career.slug}` },
  };
}

export default async function CareerPage({ params }: PageProps<"/karir/[slug]">) {
  const { slug } = await params;
  const career = await getCareerBySlug(slug);
  if (!career) notFound();
  const path = `/karir/${career.slug}`;
  const meta = [career.department, career.location, career.employmentType]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHero
        title={career.title}
        description={meta || undefined}
        crumbs={[
          { name: "Karir", path: "/karir" },
          { name: career.title, path },
        ]}
      >
        {career.closesOn ? (
          <p className="mt-4 text-sm text-primary-100">Ditutup {formatDateWIB(career.closesOn)}</p>
        ) : null}
      </PageHero>
      <Container className="grid gap-8 py-10 sm:py-14">
        {career.description.length > 0 ? <ContentBlocks blocks={career.description} /> : null}
        {career.requirements.length > 0 ? (
          <section aria-labelledby="syarat-lowongan" className="max-w-3xl">
            <h2 id="syarat-lowongan" className="text-xl font-bold">
              Persyaratan
            </h2>
            <ul className="mt-3 grid list-disc gap-1.5 pl-6">
              {career.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}
