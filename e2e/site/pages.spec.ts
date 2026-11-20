import type { Page } from "@playwright/test";
import { expect, expectNoA11yViolations, expectResponsive, test } from "../fixtures/test";

const PROJECT_PATH = "/proyek/sejahtera-green-village";

const PAGES: { path: string; h1: string }[] = [
  { path: "/proyek", h1: "Proyek" },
  { path: PROJECT_PATH, h1: "Sejahtera Green Village" },
  { path: "/berita", h1: "Berita" },
  { path: "/promo", h1: "Promo" },
  { path: "/karir", h1: "Karir" },
  { path: "/tentang", h1: "Tentang KIS Group" },
  { path: "/kontak", h1: "Kontak" },
  { path: "/kebijakan-privasi", h1: "Kebijakan privasi" },
  { path: "/syarat-ketentuan", h1: "Syarat dan ketentuan" },
];

async function jsonLdTypes(page: Page): Promise<string[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const data = JSON.parse(text) as { "@graph"?: { "@type": string }[] };
    return (data["@graph"] ?? []).map((node) => node["@type"]);
  });
}

test.describe("Halaman publik", () => {
  for (const { path, h1 } of PAGES) {
    test(`${path} tampil dengan satu h1, canonical, axe, dan responsif`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical ?? "").pathname).toBe(path);
      await expect(page.getByRole("navigation", { name: "Jejak halaman" })).toBeVisible();
      await expectNoA11yViolations(page);
      await expectResponsive(page);
    });
  }

  test("semua tautan internal di header dan footer tidak 404", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('header a[href^="/"], footer a[href^="/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    const unique = [...new Set(hrefs.map((href) => href.split("#")[0] ?? "/"))];
    expect(unique.length).toBeGreaterThan(5);
    for (const href of unique) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });

  test("menu Proyek langsung ke detail karena hanya ada satu proyek terbit", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    if (isMobile) {
      await page.getByRole("button", { name: "Buka menu" }).click();
      await page
        .getByRole("dialog", { name: "Menu" })
        .getByRole("link", { name: "Proyek" })
        .click();
    } else {
      await page
        .getByRole("navigation", { name: "Navigasi utama" })
        .getByRole("link", { name: "Proyek" })
        .click();
    }
    await expect(page).toHaveURL(PROJECT_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sejahtera Green Village");
  });

  for (const path of [
    "/proyek/tidak-ada",
    "/proyek/proyek-draft-dummy",
    "/berita/berita-draft-dummy",
    "/promo/promo-kedaluwarsa-dummy",
    "/karir/lowongan-draft-dummy",
  ]) {
    test(`${path} menampilkan 404 di dalam layout website`, async ({ page }) => {
      // Konten dinamis di-stream, jadi status bisa 200. Yang wajib: halaman 404 dan noindex.
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.getByRole("contentinfo")).toBeVisible();
    });
  }

  test("halaman kosong menampilkan keadaan kosong yang jelas", async ({ page }) => {
    await page.goto("/berita");
    await expect(page.getByText("Belum ada berita.")).toBeVisible();
    await page.goto("/promo");
    await expect(page.getByText("Belum ada promo yang berlaku.")).toBeVisible();
    await page.goto("/karir");
    await expect(page.getByText("Belum ada lowongan yang dibuka.")).toBeVisible();
  });
});

test.describe("Detail proyek", () => {
  test("galeri bisa diperbesar dan digeser dengan tombol maupun keyboard", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    const gallery = page.getByRole("list", { name: "Galeri Sejahtera Green Village" });
    await expect(gallery.getByRole("listitem")).toHaveCount(7);
    await gallery.getByRole("button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("1 / 7")).toBeVisible();
    await dialog.getByRole("button", { name: "Berikutnya" }).click();
    await expect(dialog.getByText("2 / 7")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText("1 / 7")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText("7 / 7")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("tipe unit, FAQ, dan data terstruktur dari database", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    const units = page.locator("#tipe-unit");
    await expect(units.getByRole("heading", { name: "Tipe 36/60" })).toBeVisible();
    await expect(units.getByText("Rp 571.250.000")).toBeVisible();
    await expect(page.getByText("Mulai Rp 500 jutaan")).toBeVisible();

    const faq = page.locator("#faq");
    const question = faq.getByText("Berapa harga rumah Tipe 36/60?");
    await question.click();
    await expect(faq.getByText(/^Rp 571\.250\.000\. Rincian biaya/)).toBeVisible();

    const types = await jsonLdTypes(page);
    expect(types).toEqual(
      expect.arrayContaining(["RealEstateListing", "FAQPage", "BreadcrumbList"]),
    );
  });
});

test.describe("SEO dan kontak", () => {
  test("sitemap memuat halaman terbit saja", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(PROJECT_PATH);
    expect(xml).toContain("/kebijakan-privasi");
    expect(xml).not.toContain("draft-dummy");
    expect(xml).not.toContain("kedaluwarsa-dummy");
  });

  test("tombol WhatsApp melayang menyebut halaman asal", async ({ page }) => {
    await page.goto("/kontak");
    // Navigasi ke wa.me dicegah supaya href yang disusun saat klik bisa diperiksa.
    await page.evaluate(() => {
      document.addEventListener("click", (event) => {
        event.preventDefault();
      });
    });
    const button = page.getByRole("link", { name: "Chat marketing lewat WhatsApp" });
    await button.click();
    const url = new URL((await button.getAttribute("href")) ?? "");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/6288290957177");
    expect(url.searchParams.get("text")).toContain("Kontak");
    expect(url.searchParams.get("text")).toContain("/kontak");
  });

  test("footer memuat ikon Instagram dan WhatsApp dengan label", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const instagram = footer.getByRole("link", { name: "Instagram @kreatifsejahteraproject" });
    await expect(instagram).toHaveAttribute(
      "href",
      "https://instagram.com/kreatifsejahteraproject",
    );
    await expect(instagram.locator("svg")).toHaveCount(1);
    await expect(footer.getByRole("link", { name: "WhatsApp +62 882-9095-7177" })).toBeVisible();
  });
});
