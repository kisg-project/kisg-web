import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { featuredProject, formatProjectAddress } from "@/config/featured-project";
import { siteConfig, whatsappLink } from "@/config/site";
import { env } from "@/env";
import { HeroBanner } from "@/features/cms";
import { KprSimulator } from "@/features/kpr";
import { UnitHighlights } from "@/features/projects";
import { featuredListingJsonLd, jsonLdGraph, organizationJsonLd } from "@/lib/seo/structured-data";
import { formatRupiah } from "@/lib/format";

const HERO_OG_IMAGE = "/images/hero/sgv-hero-desktop.webp";
const description = `Rumah ${featuredProject.unitType.name} di ${featuredProject.name}, ${featuredProject.area}, ${featuredProject.regency}. ${featuredProject.unitType.bedrooms} kamar tidur, ${featuredProject.unitType.bathrooms} kamar mandi, carport, smart door lock. Harga ${formatRupiah(featuredProject.unitType.price)}.`;

export const metadata: Metadata = {
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: siteConfig.name,
    title: `${featuredProject.name}, ${featuredProject.area}`,
    description,
    images: [
      { url: HERO_OG_IMAGE, width: 2048, height: 1337, alt: `Rumah ${featuredProject.name}` },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${featuredProject.name}, ${featuredProject.area}`,
    description,
    images: [HERO_OG_IMAGE],
  },
};

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${featuredProject.name}, ${formatProjectAddress()}`,
)}`;

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          organizationJsonLd(env.NEXT_PUBLIC_SITE_URL),
          featuredListingJsonLd(env.NEXT_PUBLIC_SITE_URL, [
            HERO_OG_IMAGE,
            "/images/hero/sgv-hero-mobile.webp",
          ]),
        ])}
      />
      <HeroBanner />

      <Section id="tipe-unit" className="scroll-mt-(--header-height)">
        <UnitHighlights project={featuredProject} />
      </Section>

      <Section
        id="simulasi-kpr"
        tone="surface"
        title="Simulasi KPR"
        description="Hitung perkiraan cicilan KPR konvensional dan KPR syariah. Semua angka bisa diubah."
        className="scroll-mt-(--header-height)"
      >
        <KprSimulator price={featuredProject.unitType.price} />
      </Section>

      <Section id="lokasi" title="Lokasi" className="scroll-mt-(--header-height)">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="flex max-w-2xl gap-3 text-base">
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold">{featuredProject.name}</span>
              {formatProjectAddress()}
            </span>
          </p>
          <Button asChild variant="outline">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Buka di Google Maps
            </a>
          </Button>
        </div>
      </Section>

      <section aria-labelledby="cta-judul" className="bg-primary-900 py-12 text-white sm:py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 id="cta-judul" className="text-2xl font-bold sm:text-3xl">
              Jadwalkan survei lokasi
            </h2>
            <p className="mt-2 text-primary-100">
              Marketing kami mengatur jadwal kunjungan ke {featuredProject.name}.
            </p>
          </div>
          <Button asChild variant="highlight" size="lg">
            <a
              href={whatsappLink(`Halo, saya ingin jadwal survei ke ${featuredProject.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone aria-hidden="true" />
              Atur jadwal survei
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
