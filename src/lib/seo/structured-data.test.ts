import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  listingJsonLd,
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

const LISTING = {
  name: "Sejahtera Green Village",
  path: "/proyek/sejahtera-green-village",
  address: {
    street: "Jl. Garuda 3 No. NK-34",
    village: "Mangunjaya",
    district: "Kec. Tambun Selatan",
    city: "Kab. Bekasi",
    province: "Jawa Barat",
    postalCode: "17510",
  },
  imagePaths: ["/images/hero/sgv-hero-desktop.webp"],
  unit: {
    name: "Tipe 36/60",
    price: 571_250_000,
    bedrooms: 2,
    bathrooms: 1,
    buildingArea: 36,
    features: ["Carport"],
  },
};

describe("listingJsonLd", () => {
  it("memuat harga rupiah, spesifikasi unit, dan alamat proyek", () => {
    const data = listingJsonLd(SITE, LISTING);
    expect(data).toMatchObject({
      "@type": "RealEstateListing",
      url: "https://kisgroup.co.id/proyek/sejahtera-green-village",
      offers: { price: 571_250_000, priceCurrency: "IDR" },
      about: {
        numberOfBedrooms: 2,
        numberOfBathroomsTotal: 1,
        address: { postalCode: "17510", addressLocality: "Mangunjaya, Kec. Tambun Selatan" },
      },
      image: ["https://kisgroup.co.id/images/hero/sgv-hero-desktop.webp"],
    });
  });

  it("tanpa Offer kalau harga tidak ditampilkan", () => {
    const data = listingJsonLd(SITE, { ...LISTING, unit: { ...LISTING.unit, price: null } });
    expect(data).not.toHaveProperty("offers");
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
