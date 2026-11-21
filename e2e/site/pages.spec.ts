import type { Page } from "@playwright/test";
import { expect, expectNoA11yViolations, expectResponsive, test } from "../fixtures/test";

const PROJECT_PATH = "/proyek/sejahtera-green-village";

const PAGES: { path: string; h1: string }[] = [
  { path: "/proyek", h1: "Proyek" },
  { path: PROJECT_PATH, h1: "Sejahtera Green Village" },
  { path: "/berita", h1: "Berita" },
  { path: "/promo", h1: "Promo" },
  { path: "/karir", h1: "Karir" },
  { path: "/karir/jenjang/magang", h1: "Karir Magang" },
  {
    path: "/berita/bi-rate-naik-ke-6-persen-cara-menjaga-cicilan-kpr",
    h1: "BI-Rate naik ke 6 persen: cara menjaga cicilan KPR tetap terkendali",
  },
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

  test("menu Proyek membuka daftar proyek karena ada lebih dari satu proyek terbit", async ({
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
    await expect(page).toHaveURL("/proyek");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Proyek");
  });

  for (const path of [
    "/proyek/tidak-ada",
    "/proyek/proyek-draft-dummy",
    "/berita/berita-draft-dummy",
    "/promo/promo-kedaluwarsa-dummy",
    "/karir/lowongan-draft-dummy",
    "/karir/jenjang/tidak-ada",
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
    await page.goto("/promo");
    await expect(page.getByText("Belum ada promo yang berlaku.")).toBeVisible();
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

test.describe("Profil perusahaan", () => {
  test("tentang: tahun berdiri, visi, misi, dan layanan dari company profile", async ({ page }) => {
    await page.goto("/tentang");
    await expect(page.getByText("2022", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visi dan misi" })).toBeVisible();
    await expect(page.getByText(/^Menjadi pengembang properti yang terpercaya/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Misi" }).locator("..").getByRole("listitem"),
    ).toHaveCount(4);
    for (const service of ["Pengembangan perumahan", "Solusi pembiayaan", "Konsultasi properti"]) {
      await expect(page.getByRole("heading", { name: service })).toBeVisible();
    }
  });

  test("beranda: strip angka dari database, dan detail proyek memuat deskripsi", async ({
    page,
  }) => {
    await page.goto("/");
    const stats = page.getByRole("region", { name: "KIS Group dalam angka" });
    await expect(stats.getByText("Unit di Sejahtera Green Village")).toBeVisible();
    await stats.scrollIntoViewIfNeeded();
    await expect(stats.getByText("16", { exact: true })).toBeVisible();
    await expect(stats.getByText("2022", { exact: true })).toBeVisible();
    await page.goto(PROJECT_PATH);
    await expect(page.locator("#tentang-proyek")).toContainText("16 unit tipe 36");
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

  test("tombol WhatsApp di panel chat menyebut halaman asal", async ({ page }) => {
    await page.goto("/kontak");
    // Satu tombol melayang: membuka chat Jaka, dan panel chat punya tombol WhatsApp.
    await page.getByRole("button", { name: "Tanya Jaka" }).click();
    // Navigasi ke wa.me dicegah supaya href yang disusun saat klik bisa diperiksa.
    await page.evaluate(() => {
      document.addEventListener("click", (event) => {
        event.preventDefault();
      });
    });
    const button = page
      .getByRole("dialog", { name: "Chat dengan Jaka" })
      .getByRole("link", { name: "Chat marketing lewat WhatsApp" });
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
    for (const address of [
      "hallo@kisgroup.co.id",
      "marketing@kisgroup.co.id",
      "corporate@kisgroup.co.id",
    ]) {
      await expect(footer.getByRole("link", { name: address })).toHaveAttribute(
        "href",
        `mailto:${address}`,
      );
    }
  });

  test("halaman kontak menampilkan tiga email publik dan JSON-LD beranda memuat email", async ({
    page,
  }) => {
    await page.goto("/kontak");
    const list = page.getByRole("list", { name: "Alamat email" });
    await expect(list.getByRole("listitem")).toHaveCount(3);
    await expect(list.getByText("Keluhan dan layanan pelanggan")).toBeVisible();
    for (const address of [
      "hallo@kisgroup.co.id",
      "marketing@kisgroup.co.id",
      "corporate@kisgroup.co.id",
    ]) {
      await expect(list.getByRole("link", { name: address })).toHaveAttribute(
        "href",
        `mailto:${address}`,
      );
    }
    // JSON-LD organisasi ada di beranda.
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join(" ")).toContain('"email":"hallo@kisgroup.co.id"');
  });

  test("footer memakai logo terang tanpa kotak dan peta kantor yang menaut ke Google Maps", async ({
    page,
  }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("img", { name: "Logo KIS Group" })).toHaveAttribute(
      "src",
      /logo-kis-light/,
    );
    const map = footer.getByRole("link", { name: /Buka lokasi kantor pemasaran di Google Maps/ });
    await expect(map).toBeVisible();
    const url = new URL((await map.getAttribute("href")) ?? "");
    expect(url.hostname).toBe("www.google.com");
    expect(url.searchParams.get("query")).toContain("Bekasi");
    await expect(map.getByText("Kantor KIS, Bekasi")).toBeVisible();
  });

  test("tautan Instagram di halaman Tentang tidak mengulang kata Instagram", async ({ page }) => {
    await page.goto("/tentang");
    const link = page
      .getByRole("main")
      .getByRole("link", { name: "Instagram @kreatifsejahteraproject" });
    await expect(link).toHaveText("@kreatifsejahteraproject");
  });
});

test.describe("Berita", () => {
  test("daftar berita berisi artikel bersampul dari migrasi", async ({ page }) => {
    // Test CMS bisa menerbitkan berita lain secara paralel, jadi jumlahnya minimal 10.
    await page.goto("/berita");
    const items = page.getByRole("list", { name: "Daftar berita" }).getByRole("listitem");
    // Daftar di-stream setelah kerangka halaman: tunggu item pertama sebelum menghitung.
    await expect(items.first()).toBeVisible();
    expect(await items.count()).toBeGreaterThanOrEqual(10);
    const bi = items.filter({ hasText: "BI-Rate naik ke 6 persen" });
    await expect(bi).toHaveCount(1);
    await expect(bi.locator("img")).toHaveCount(1);
  });

  test("detail berita: satu h1, Article JSON-LD, dan sumber berupa tautan keluar", async ({
    page,
  }) => {
    await page.goto("/berita/beli-rumah-baru-bebas-ppn-2026-ini-syarat-lengkapnya");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Beli rumah baru bebas PPN di 2026: ini syarat lengkapnya",
    );
    expect(await jsonLdTypes(page)).toContain("Article");
    const sources = page.getByRole("region", { name: "Sumber" });
    const links = sources.getByRole("link");
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute("href", /^https:\/\/pajak\.go\.id\//);
    await expect(links.first()).toHaveAttribute("target", "_blank");
    await expect(links.first()).toHaveAttribute("rel", "noopener noreferrer");
  });
});

test.describe("Karir per jenjang", () => {
  test("halaman karir menampilkan empat jenjang bergambar", async ({ page }) => {
    await page.goto("/karir");
    // Nama tautan kartu diawali alt foto, lalu judul jenjang, jadi dicocokkan tanpa jangkar awal.
    const cards = page.getByRole("list", { name: "Jenjang posisi" }).getByRole("listitem");
    await expect(cards).toHaveCount(4);
    for (const name of ["Berpengalaman", "Lulusan baru", "Staf lapangan", "Magang"]) {
      const card = cards.filter({ hasText: name }).getByRole("link");
      await expect(card).toBeVisible();
      await expect(card.locator("img")).toHaveCount(1);
    }
    await cards.filter({ hasText: "Staf lapangan" }).getByRole("link").click();
    await expect(page).toHaveURL("/karir/jenjang/lapangan");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Karir Staf lapangan");
  });

  test("jenjang tanpa lowongan menampilkan keadaan kosong dan tautan ke jenjang lain", async ({
    page,
  }) => {
    // Jenjang yang tidak dipakai test lain (test CMS menerbitkan lowongan magang secara paralel).
    await page.goto("/karir/jenjang/lulusan-baru");
    await expect(page.getByText("Belum ada lowongan untuk jenjang ini.")).toBeVisible();
    const status = page.getByRole("status");
    await expect(status.getByRole("link")).toHaveCount(3);
    await status.getByRole("link", { name: "Berpengalaman" }).click();
    await expect(page).toHaveURL("/karir/jenjang/berpengalaman");
  });

  test("sitemap memuat halaman jenjang karir", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    for (const slug of ["berpengalaman", "lulusan-baru", "lapangan", "magang"]) {
      expect(body).toContain(`/karir/jenjang/${slug}`);
    }
  });
});

test.describe("Proyek sold out", () => {
  const SOLD_OUT = [
    "Sejahtera Residence Mangunjaya",
    "Sejahtera Residence Tapos",
    "Sejahtera Residence Sumberjaya",
  ];

  test("daftar proyek: Sejahtera Green Village di depan, tiga proyek lain bertanda Sold out", async ({
    page,
  }) => {
    await page.goto("/proyek");
    const items = page.getByRole("list", { name: "Daftar proyek" }).getByRole("listitem");
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText("Sejahtera Green Village");
    await expect(items.first()).not.toContainText("Sold out");
    for (const name of SOLD_OUT) {
      const card = items.filter({ hasText: name });
      await expect(card).toContainText("Sold out");
      await expect(card.locator("img")).toHaveCount(1);
    }
  });

  test("detail proyek sold out tanpa form minat dan mengarah ke proyek yang tersedia", async ({
    page,
  }) => {
    await page.goto("/proyek/sejahtera-residence-tapos");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sejahtera Residence Tapos");
    await expect(page.getByText("Sold out").first()).toBeVisible();
    await expect(page.getByText("Pembangunan dimulai tahun 2023")).toBeVisible();
    await expect(page.getByRole("form")).toHaveCount(0);
    await page.getByRole("link", { name: "Lihat Sejahtera Green Village" }).click();
    await expect(page).toHaveURL(PROJECT_PATH);
  });

  test("detail proyek sold out lolos aksesibilitas dan responsif", async ({ page }) => {
    await page.goto("/proyek/sejahtera-residence-sumberjaya");
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("sitemap memuat proyek sold out", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).toContain("/proyek/sejahtera-residence-mangunjaya");
  });
});
