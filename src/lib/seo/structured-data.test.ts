import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  featuredListingJsonLd,
  jsonLdGraph,
  organizationJsonLd,
  serializeJsonLd,
} from "./structured-data";

const SITE = "https://kisgroup.co.id";

describe("absoluteUrl", () => {
  it("menggabungkan URL situs dan path dengan atau tanpa garis miring", () => {
    expect(absoluteUrl(SITE, "/brand/logo-kis.png")).toBe(
      "https://kisgroup.co.id/brand/logo-kis.png",
    );
    expect(absoluteUrl(`${SITE}/`)).toBe("https://kisgroup.co.id/");
  });
});

describe("organizationJsonLd", () => {
  it("memuat nama resmi, alamat kantor, dan kontak WhatsApp", () => {
    const data = organizationJsonLd(SITE);
    expect(data).toMatchObject({
      "@type": "RealEstateAgent",
      legalName: "PT Kreatif Inovatif Sejahtera Group",
      telephone: "+6289673296881",
      address: { postalCode: "17123", addressCountry: "ID" },
    });
  });
});

describe("featuredListingJsonLd", () => {
  it("memuat harga rupiah dan spesifikasi unit", () => {
    const data = featuredListingJsonLd(SITE, ["/images/hero/sgv-hero-desktop.webp"]);
    expect(data).toMatchObject({
      "@type": "RealEstateListing",
      offers: { price: 571_250_000, priceCurrency: "IDR" },
      about: { numberOfBedrooms: 2, numberOfBathroomsTotal: 1, address: { postalCode: "17510" } },
      image: ["https://kisgroup.co.id/images/hero/sgv-hero-desktop.webp"],
    });
  });
});

describe("serializeJsonLd", () => {
  it("meng-escape < supaya tidak bisa menutup tag script", () => {
    const text = serializeJsonLd(jsonLdGraph([{ name: "</script><script>alert(1)</script>" }]));
    expect(text).not.toContain("</script>");
    expect(JSON.parse(text)).toMatchObject({
      "@graph": [{ name: "</script><script>alert(1)</script>" }],
    });
  });
});
