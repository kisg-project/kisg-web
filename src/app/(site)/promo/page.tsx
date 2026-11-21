import type { Metadata } from "next";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-message";
import { MediaCard } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { getActivePromos, type PromoSummary } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/promo",
  title: "Promo rumah",
  description:
    "Promo pembelian rumah KIS Group yang sedang berlaku, lengkap dengan masa berlaku dan syaratnya.",
});

function promoPeriod(promo: Pick<PromoSummary, "startsAt" | "endsAt">): string | null {
  if (promo.endsAt) return `Berlaku sampai ${formatDateWIB(promo.endsAt)}`;
  if (promo.startsAt) return `Berlaku mulai ${formatDateWIB(promo.startsAt)}`;
  return null;
}

export default async function PromosPage() {
  const promos = await getActivePromos();
  return (
    <>
      <PageHero
        title="Promo"
        description="Promo yang sedang berlaku."
        crumbs={[{ name: "Promo", path: "/promo" }]}
      />
      <Section>
        {promos.length === 0 ? (
          <EmptyState
            title="Belum ada promo yang berlaku."
            description="Tanyakan penawaran terbaru ke marketing lewat WhatsApp."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((promo, index) => (
              <li key={promo.id}>
                <Reveal delay={(index % 3) * 80} className="h-full">
                  <MediaCard
                    href={`/promo/${promo.slug}`}
                    title={promo.title}
                    image={promo.cover}
                    meta={promoPeriod(promo)}
                  >
                    {promo.summary}
                  </MediaCard>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
