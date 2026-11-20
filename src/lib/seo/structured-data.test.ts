import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
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
      telephone: "+6288290957177",
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

describe("breadcrumb, artikel, dan FAQ", () => {
  it("breadcrumb berurutan dengan URL absolut", () => {
    expect(
      breadcrumbJsonLd(SITE, [
        { name: "Beranda", path: "/" },
        { name: "Berita", path: "/berita" },
      ]),
    ).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, item: "https://kisgroup.co.id/" },
        { position: 2, name: "Berita", item: "https://kisgroup.co.id/berita" },
      ],
    });
  });

  it("artikel tanpa gambar tidak memuat properti image", () => {
    const data = articleJsonLd(SITE, {
      title: "Judul",
      path: "/berita/judul",
      publishedAt: "2026-11-20T00:00:00Z",
      image: null,
      description: null,
    });
    expect(data).toMatchObject({ "@type": "Article", headline: "Judul" });
    expect(data).not.toHaveProperty("image");
  });

  it("FAQ memetakan pertanyaan dan jawaban", () => {
    expect(faqJsonLd([{ question: "Harga?", answer: "Rp 1" }])).toMatchObject({
      mainEntity: [{ name: "Harga?", acceptedAnswer: { text: "Rp 1" } }],
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
