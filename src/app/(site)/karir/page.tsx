import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-message";
import { PageHero } from "@/components/site/page-hero";
import { getOpenCareers } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";

export const metadata: Metadata = {
  title: "Karir",
  description:
    "Lowongan kerja di KIS Group, developer perumahan di Bekasi. Kirim lamaran langsung dari halaman lowongan.",
  alternates: { canonical: "/karir" },
};

export default async function CareersPage() {
  const careers = await getOpenCareers();
  return (
    <>
      <PageHero
        title="Karir"
        description="Lowongan yang sedang dibuka di KIS Group."
        crumbs={[{ name: "Karir", path: "/karir" }]}
      />
      <Section>
        {careers.length === 0 ? (
          <EmptyState
            title="Belum ada lowongan yang dibuka."
            description="Lowongan baru akan tampil di sini."
          />
        ) : (
          <ul className="grid gap-4">
            {careers.map((career, index) => (
              <li key={career.id}>
                <Reveal delay={index * 60}>
                  <Link
                    href={`/karir/${career.slug}`}
                    className="group flex lift flex-col gap-3 rounded-lg border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      <span className="block text-lg font-bold group-hover:text-primary">
                        {career.title}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {career.department ? (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase aria-hidden="true" className="size-4" />
                            {career.department}
                          </span>
                        ) : null}
                        {career.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin aria-hidden="true" className="size-4" />
                            {career.location}
                          </span>
                        ) : null}
                        {career.closesOn ? (
                          <span>Ditutup {formatDateWIB(career.closesOn)}</span>
                        ) : null}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
