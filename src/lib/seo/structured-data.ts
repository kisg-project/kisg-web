// Data terstruktur schema.org (JSON-LD) untuk SEO (CLAUDE.md bagian 6, SEO maksimal).

import { featuredProject } from "@/config/featured-project";
import { siteConfig } from "@/config/site";

type JsonLd = Record<string, unknown>;

export function absoluteUrl(siteUrl: string, path = "/"): string {
  return new URL(path, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

export function organizationJsonLd(siteUrl: string): JsonLd {
  const { address } = siteConfig;
  return {
    "@type": "RealEstateAgent",
    "@id": absoluteUrl(siteUrl, "/#organisasi"),
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: absoluteUrl(siteUrl),
    logo: absoluteUrl(siteUrl, siteConfig.logo.src),
    image: absoluteUrl(siteUrl, siteConfig.logo.src),
    telephone: siteConfig.whatsapp.e164,
    sameAs: [siteConfig.instagram.url],
    address: {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: `${address.village}, ${address.district}`,
      addressRegion: `${address.city}, ${address.province}`,
      postalCode: address.postalCode,
      addressCountry: "ID",
    },
    areaServed: { "@type": "AdministrativeArea", name: featuredProject.regency },
  };
}

export function featuredListingJsonLd(siteUrl: string, imagePaths: readonly string[]): JsonLd {
  const { address, unitType } = featuredProject;
  const pageUrl = absoluteUrl(siteUrl);
  return {
    "@type": "RealEstateListing",
    "@id": absoluteUrl(siteUrl, "/#listing"),
    name: `${featuredProject.name} ${unitType.name}`,
    url: pageUrl,
    image: imagePaths.map((path) => absoluteUrl(siteUrl, path)),
    provider: { "@id": absoluteUrl(siteUrl, "/#organisasi") },
    offers: {
      "@type": "Offer",
      price: unitType.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: pageUrl,
      seller: { "@id": absoluteUrl(siteUrl, "/#organisasi") },
    },
    about: {
      "@type": "SingleFamilyResidence",
      name: `Rumah ${unitType.name} ${featuredProject.name}`,
      numberOfBedrooms: unitType.bedrooms,
      numberOfBathroomsTotal: unitType.bathrooms,
      floorSize: { "@type": "QuantitativeValue", value: unitType.buildingArea, unitCode: "MTK" },
      amenityFeature: featuredProject.features.map((feature) => ({
        "@type": "LocationFeatureSpecification",
        name: feature.label,
        value: true,
      })),
      address: {
        "@type": "PostalAddress",
        streetAddress: address.street,
        addressLocality: `${address.village}, ${address.district}`,
        addressRegion: `${address.city}, ${address.province}`,
        postalCode: address.postalCode,
        addressCountry: "ID",
      },
    },
  };
}

/** Menggabungkan beberapa node dalam satu @graph. */
export function jsonLdGraph(nodes: JsonLd[]): JsonLd {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** Serialisasi aman untuk <script type="application/ld+json">: karakter < di-escape supaya tidak menutup tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
