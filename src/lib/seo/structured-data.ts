// Data terstruktur schema.org (JSON-LD) untuk SEO (CLAUDE.md bagian 6, SEO maksimal).

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
    areaServed: { "@type": "AdministrativeArea", name: "Kabupaten Bekasi" },
  };
}

/** Alamat proyek (bentuknya sama dengan ProjectAddress di fitur projects). */
export interface ListingAddress {
  street: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
}

export interface ListingInput {
  name: string;
  /** Path halaman listing, misal "/proyek/sejahtera-green-village". */
  path: string;
  address: ListingAddress;
  imagePaths: readonly string[];
  unit: {
    name: string;
    price: number | null;
    bedrooms: number;
    bathrooms: number;
    buildingArea: number;
    features: readonly string[];
  };
}

function postalAddress(address: ListingAddress): JsonLd {
  return {
    "@type": "PostalAddress",
    streetAddress: address.street ?? undefined,
    addressLocality: [address.village, address.district].filter(Boolean).join(", ") || undefined,
    addressRegion: [address.city, address.province].filter(Boolean).join(", ") || undefined,
    postalCode: address.postalCode ?? undefined,
    addressCountry: "ID",
  };
}

/** Listing rumah satu tipe unit. Offer hanya kalau harga boleh ditampilkan (data asli saja). */
export function listingJsonLd(siteUrl: string, input: ListingInput): JsonLd {
  const pageUrl = absoluteUrl(siteUrl, input.path);
  const organization = { "@id": absoluteUrl(siteUrl, "/#organisasi") };
  return {
    "@type": "RealEstateListing",
    "@id": `${pageUrl}#listing`,
    name: `${input.name} ${input.unit.name}`,
    url: pageUrl,
    image: input.imagePaths.map((path) => absoluteUrl(siteUrl, path)),
    provider: organization,
    ...(input.unit.price === null
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: input.unit.price,
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
            url: pageUrl,
            seller: organization,
          },
        }),
    about: {
      "@type": "SingleFamilyResidence",
      name: `Rumah ${input.unit.name} ${input.name}`,
      numberOfBedrooms: input.unit.bedrooms,
      numberOfBathroomsTotal: input.unit.bathrooms,
      floorSize: { "@type": "QuantitativeValue", value: input.unit.buildingArea, unitCode: "MTK" },
      amenityFeature: input.unit.features.map((feature) => ({
        "@type": "LocationFeatureSpecification",
        name: feature,
        value: true,
      })),
      address: postalAddress(input.address),
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
