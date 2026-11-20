import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/config/site";
import { ContentBlocks, getPromoBySlug } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/promo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const promo = await getPromoBySlug(slug);
  if (!promo) return { title: "Promo tidak ditemukan", robots: { index: false } };
  const path = `/promo/${promo.slug}`;
  return {
    title: promo.title,
    description: promo.summary ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: promo.title,
      description: promo.summary ?? undefined,
      images: promo.cover ? [{ url: promo.cover.src, alt: promo.cover.alt }] : [],
    },
  };
}

export default async function PromoPage({ params }: PageProps<"/promo/[slug]">) {
  const { slug } = await params;
  const promo = await getPromoBySlug(slug);
  if (!promo) notFound();
  const path = `/promo/${promo.slug}`;

  return (
    <>
      <PageHero
        title={promo.title}
        description={promo.summary ?? undefined}
        crumbs={[
          { name: "Promo", path: "/promo" },
          { name: promo.title, path },
        ]}
      >
        {promo.endsAt ? (
          <p className="mt-4 inline-flex rounded-md bg-highlight px-3 py-1.5 text-sm font-bold text-highlight-foreground">
            Berlaku sampai {formatDateWIB(promo.endsAt)}
          </p>
        ) : null}
      </PageHero>
      <Container className="grid gap-8 py-10 sm:py-14">
        {promo.cover ? (
          <div className="relative aspect-[16/9] max-w-3xl overflow-hidden rounded-lg">
            <Image
              src={promo.cover.src}
              alt={promo.cover.alt}
              fill
              sizes="(min-width: 768px) 48rem, 100vw"
              className="object-cover"
              fetchPriority="high"
            />
          </div>
        ) : null}
        <ContentBlocks blocks={promo.body} />
        {promo.terms ? (
          <section aria-labelledby="syarat-promo" className="max-w-3xl rounded-lg bg-surface p-5">
            <h2 id="syarat-promo" className="text-lg font-bold">
              Syarat dan ketentuan promo
            </h2>
            <p className="mt-2 text-sm whitespace-pre-line text-subtle-foreground">{promo.terms}</p>
          </section>
        ) : null}
        <div>
          <Button asChild size="lg">
            <a
              href={whatsappLink(`Halo, saya ingin info promo ${promo.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone aria-hidden="true" />
              Tanya promo ini
            </a>
          </Button>
        </div>
      </Container>
    </>
  );
}
