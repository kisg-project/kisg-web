import { expect, expectNoA11yViolations, expectResponsive, test } from "../fixtures/test";

test.describe("Beranda", () => {
  test("hero penuh satu layar di bawah navbar, dengan CTA WhatsApp", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Sejahtera Green Village" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Sejahtera Green Village" }),
    ).toBeVisible();
    await expect(hero.getByRole("img", { name: /Deretan rumah Tipe 36\/60/ })).toBeVisible();

    const viewport = page.viewportSize();
    const header = await page.getByRole("banner").boundingBox();
    const heroBox = await hero.boundingBox();
    expect(viewport && header && heroBox).toBeTruthy();
    if (viewport && header && heroBox) {
      expect(heroBox.y).toBeCloseTo(header.height, 0);
      expect(heroBox.height).toBeCloseTo(Math.max(viewport.height - header.height, 448), 0);
    }

    const href = await hero.getByRole("link", { name: "Hubungi marketing" }).getAttribute("href");
    const url = new URL(href ?? "");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/6289673296881");
    expect(url.searchParams.get("text")).toContain("Sejahtera Green Village");
  });

  test("ringkasan unit menampilkan harga, spesifikasi, fasilitas, dan rincian biaya", async ({
    page,
  }) => {
    await page.goto("/");
    const unit = page.locator("#tipe-unit");
    await expect(unit.getByRole("heading", { name: "Tipe 36/60" })).toBeVisible();
    await expect(unit.getByText("Rp 571.250.000")).toBeVisible();

    const specs = unit.getByRole("list", { name: "Spesifikasi" });
    await expect(specs.getByRole("listitem")).toHaveText([
      /2\s*Kamar tidur/,
      /1\s*Kamar mandi/,
      /36 m²\s*Luas bangunan/,
      /60 m²\s*Luas tanah/,
    ]);
    await expect(unit.getByRole("list", { name: "Fasilitas" })).toContainText("Smart door lock");
    await expect(unit.getByRole("list", { name: "Akses dan sekitar" })).toContainText(
      "Stasiun Tambun",
    );
    await expect(unit.getByText("Biaya balik nama sertifikat di BPN")).toBeVisible();
    await expect(unit.getByText("Pajak pembelian (BPHTB)")).toBeVisible();
  });

  test("lolos aksesibilitas dan responsif di semua lebar", async ({ page }) => {
    await page.goto("/");
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("menu HP membuka navigasi dan menuju simulasi KPR", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Menu ringkas hanya tampil di layar kecil");
    await page.goto("/");
    await page.getByRole("button", { name: "Buka menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Simulasi KPR" }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#simulasi-kpr$/);
    await expect(page.getByRole("heading", { name: "Simulasi KPR" })).toBeInViewport();
  });

  test("navigasi desktop tampil dan menu HP tersembunyi", async ({ page, isMobile }) => {
    test.skip(isMobile, "Khusus layar lebar");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    await expect(nav.getByRole("link", { name: "Tipe unit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buka menu" })).toBeHidden();
  });
});

test.describe("Simulasi KPR", () => {
  test("KPR konvensional memakai harga proyek dan menghitung cicilan fixed dan floating", async ({
    page,
  }) => {
    await page.goto("/#simulasi-kpr");
    const panel = page.getByRole("tabpanel", { name: "KPR konvensional" });
    await expect(panel.getByLabel("Harga rumah")).toHaveValue("571250000");
    await expect(panel.getByText("Rp 4.766.002")).toBeVisible();
    await expect(panel.getByText("Rp 5.661.769")).toBeVisible();

    await panel.getByLabel("Uang muka (persen)").fill("20");
    await expect(panel.getByLabel("Uang muka (rupiah)")).toHaveValue("114250000");
    await panel.getByLabel("Masa bunga fixed").fill("15");
    await expect(panel.getByText("Rp 4.236.446")).toBeVisible();
    await expect(panel.getByText("Perkiraan cicilan setelah masa fixed")).toBeHidden();
  });

  test("KPR syariah menghitung angsuran tetap murabahah", async ({ page }) => {
    await page.goto("/#simulasi-kpr");
    await page.getByRole("tab", { name: "KPR syariah" }).click();
    const panel = page.getByRole("tabpanel", { name: "KPR syariah" });
    await expect(panel.getByText("Rp 4.998.438")).toBeVisible();
    await expect(panel.getByText("180 bulan")).toBeVisible();
  });

  test("logo bank rekanan KPR tampil dan termuat", async ({ page }) => {
    await page.goto("/#simulasi-kpr");
    const banks = page.getByRole("list", { name: "Bank rekanan KPR" });
    for (const name of ["Bank BTN", "Bank Mandiri", "Bank Syariah Indonesia (BSI)"]) {
      const logo = banks.getByRole("img", { name });
      await expect(logo).toBeVisible();
      expect(await logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(
        0,
      );
    }
  });

  test("masukan tidak valid menampilkan pesan per field dan menyembunyikan hasil", async ({
    page,
  }) => {
    await page.goto("/#simulasi-kpr");
    const panel = page.getByRole("tabpanel", { name: "KPR konvensional" });
    await panel.getByLabel("Tenor").fill("40");
    await expect(panel.getByText("Tenor maksimal 30 tahun.")).toBeVisible();
    await expect(panel.getByText("Lengkapi data di form untuk melihat hasil.")).toBeVisible();
    await expect(panel.getByLabel("Tenor")).toHaveAttribute("aria-invalid", "true");

    await panel.getByLabel("Tenor").fill("10");
    await panel.getByLabel("Masa bunga fixed").fill("12");
    await expect(panel.getByText("Masa fixed tidak boleh lebih lama dari tenor.")).toBeVisible();
  });
});

test.describe("SEO", () => {
  test("metadata, canonical, Open Graph, dan JSON-LD beranda", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Sejahtera Green Village/);
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "").pathname).toBe("/");
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toContain(
      "Rp 571.250.000",
    );
    expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toContain(
      "sgv-hero-desktop.webp",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    ) as { "@graph": { "@type": string; offers?: { price: number; priceCurrency: string } }[] };
    const listing = jsonLd["@graph"].find((node) => node["@type"] === "RealEstateListing");
    expect(listing?.offers).toEqual(
      expect.objectContaining({ price: 571_250_000, priceCurrency: "IDR" }),
    );
    expect(jsonLd["@graph"].some((node) => node["@type"] === "RealEstateAgent")).toBe(true);
  });

  test("robots.txt menutup portal dan sitemap memuat beranda", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /portal");
    expect(robots).toContain("Disallow: /dev");
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("<loc>");
  });
});
