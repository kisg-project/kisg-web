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
    await expect(page).toHaveURL(/\/simulasi-kpr$/);
    await expect(page.getByRole("heading", { level: 1, name: "Simulasi KPR" })).toBeVisible();
  });

  test("ringkasan simulasi KPR menampilkan angsuran mulai dan menuju halaman simulasi", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator("#simulasi-kpr");
    await expect(section.getByText("Rp 3.464.551")).toBeVisible();
    await section.getByRole("link", { name: "Hitung simulasi lengkap" }).click();
    await expect(page).toHaveURL(/\/simulasi-kpr$/);
    await expect(page.getByRole("heading", { level: 1, name: "Simulasi KPR" })).toBeVisible();
  });

  test("logo bank rekanan KPR tampil dan termuat", async ({ page }) => {
    await page.goto("/");
    const banks = page.getByRole("list", { name: "Bank rekanan KPR" });
    for (const name of ["Bank BTN", "Bank Mandiri", "Bank Syariah Indonesia (BSI)"]) {
      const logo = banks.getByRole("img", { name });
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toBeVisible();
      // Gambar memakai lazy loading: tunggu sampai selesai dimuat, lalu pastikan file SVG terbaca.
      await expect
        .poll(() =>
          logo.evaluate((image: HTMLImageElement) => (image.complete ? image.naturalWidth : 0)),
        )
        .toBeGreaterThan(0);
    }
  });

  test("navigasi desktop tampil dan menu HP tersembunyi", async ({ page, isMobile }) => {
    test.skip(isMobile, "Khusus layar lebar");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    await expect(nav.getByRole("link", { name: "Tipe unit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buka menu" })).toBeHidden();
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
