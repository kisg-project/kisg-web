import { describe, expect, it } from "vitest";
import { isOgPagePath, OG_PAGES, ogImageUrl, pageMetadata } from "./page-metadata";

describe("pageMetadata", () => {
  it("menyusun judul tab, canonical, Open Graph, dan Twitter dengan gambar share bermerek", () => {
    const meta = pageMetadata({
      path: "/simulasi-kpr",
      title: "Simulasi KPR",
      description: "Hitung angsuran KPR.",
    });
    expect(meta.title).toBe("Simulasi KPR");
    expect(meta.alternates?.canonical).toBe("/simulasi-kpr");
    expect(meta.openGraph).toMatchObject({
      url: "/simulasi-kpr",
      title: "Simulasi KPR | KIS Group",
      description: "Hitung angsuran KPR.",
      images: [{ url: "/og?p=%2Fsimulasi-kpr", width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og?p=%2Fsimulasi-kpr"],
    });
  });

  it("beranda memakai judul default layout dan judul share dari data proyek unggulan", () => {
    const meta = pageMetadata({ path: "/", description: "Rumah di Tambun Selatan." });
    expect(meta.title).toBeUndefined();
    expect(meta.openGraph?.title).toBe(`${OG_PAGES["/"].title} | KIS Group`);
  });
});

describe("path gambar share", () => {
  it("hanya path terdaftar yang diterima", () => {
    expect(isOgPagePath("/kontak")).toBe(true);
    expect(isOgPagePath("/teks-bebas")).toBe(false);
    expect(isOgPagePath("toString")).toBe(false);
    expect(ogImageUrl("/")).toBe("/og?p=%2F");
  });
});
