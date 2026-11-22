import { expect, expectNoA11yViolations, expectResponsive, test } from "../fixtures/test";

test.describe("Beranda", () => {
  test("hero minimal satu layar di bawah navbar, dengan harga ringkas dan CTA WhatsApp", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Banner utama" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Sejahtera Green Village" }),
    ).toBeVisible();
    const firstSlide = hero.getByRole("group", { name: /^1 dari 3/ });
    await expect(
      firstSlide.getByRole("img", { name: /Deretan rumah Sejahtera Green Village/ }),
    ).toBeVisible();
    await expect(firstSlide.getByText("Mulai Rp 570 jutaan")).toBeVisible();

    const viewport = page.viewportSize();
    const header = await page.getByRole("banner").boundingBox();
    const heroBox = await hero.boundingBox();
    expect(viewport && header && heroBox).toBeTruthy();
    if (viewport && header && heroBox) {
      expect(heroBox.y).toBeCloseTo(header.height, 0);
      // Minimal satu layar. Di HP kecil hero boleh lebih tinggi supaya foto dan teks tidak terpotong.
      expect(heroBox.height).toBeGreaterThanOrEqual(
        Math.max(viewport.height - header.height, 448) - 1,
      );
    }

    const href = await firstSlide
      .getByRole("link", { name: "Hubungi marketing" })
      .getAttribute("href");
    const url = new URL(href ?? "");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/6288290957177");
    expect(url.searchParams.get("text")).toContain("Sejahtera Green Village");
  });

  test("banner bergeser otomatis, berhenti setelah dipilih, dan bisa dikendalikan keyboard", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Banner utama" });
    // Slide nonaktif ber-aria-hidden, jadi pencarian menyertakan elemen tersembunyi.
    const slide = (n: number) =>
      hero.getByRole("group", { name: new RegExp(`^${String(n)} dari 3`), includeHidden: true });
    await expect(slide(1)).toHaveAttribute("aria-hidden", "false");
    // Kontrol hanya indikator kecil: tanpa tombol panah dan tombol jeda.
    await expect(hero.getByRole("button")).toHaveCount(3);

    // Autoplay: 7 detik per slide.
    await page.mouse.move(0, 0);
    await page.clock.fastForward(7500);
    await expect(slide(2)).toHaveAttribute("aria-hidden", "false");
    await expect(slide(1)).toHaveAttribute("aria-hidden", "true");

    // Memilih slide lewat indikator menghentikan autoplay (mekanisme jeda WCAG 2.2.2).
    await hero.getByRole("button", { name: "Tampilkan banner 3" }).click();
    await expect(slide(3)).toHaveAttribute("aria-hidden", "false");
    await expect(hero.getByRole("button", { name: "Tampilkan banner 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.mouse.move(0, 0);
    await page.clock.fastForward(20_000);
    await expect(slide(3)).toHaveAttribute("aria-hidden", "false");

    // Keyboard.
    await hero.getByRole("button", { name: "Tampilkan banner 3" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(slide(1)).toHaveAttribute("aria-hidden", "false");
    await page.keyboard.press("ArrowLeft");
    await expect(slide(3)).toHaveAttribute("aria-hidden", "false");
    // Tautan di slide yang tidak aktif tidak bisa dijangkau.
    await expect(slide(1)).toHaveAttribute("inert", "");
  });

  test("cuplikan galeri beranda tidak mengulang foto banner", async ({ page }) => {
    await page.goto("/");
    const bannerSources = await page
      .getByRole("region", { name: "Banner utama" })
      .locator("img")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
    const gallery = page.getByRole("list", { name: "Foto Sejahtera Green Village" });
    await expect(gallery.getByRole("listitem")).toHaveCount(4);
    const gallerySources = await gallery
      .locator("img")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
    const fileOf = (src: string) => decodeURIComponent(src).match(/[\w-]+\.webp/)?.[0] ?? src;
    const bannerFiles = new Set(bannerSources.map(fileOf));
    for (const src of gallerySources) expect(bannerFiles.has(fileOf(src))).toBe(false);
  });

  test("banner tidak bergeser otomatis kalau pengunjung mematikan animasi", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Banner utama" });
    await page.clock.fastForward(20_000);
    await expect(hero.getByRole("group", { name: /^1 dari 3/ })).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });

  test("ringkasan unit menampilkan harga, spesifikasi, fasilitas, dan rincian biaya", async ({
    page,
  }) => {
    await page.goto("/");
    const unit = page.locator("#tipe-unit");
    await expect(unit.getByRole("heading", { name: "Tipe 36/60" })).toBeVisible();
    await expect(unit.getByText("Rp 570.000.000")).toBeVisible();

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
    // Spesifikasi bangunan dari brosur resmi.
    const materials = unit.getByLabel("Spesifikasi bangunan");
    await expect(materials).toContainText("Cakar ayam");
    await expect(materials).toContainText("1.300 watt");
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
    await expect(section.getByText("Rp 3.456.970")).toBeVisible();
    await section.getByRole("link", { name: "Hitung simulasi lengkap" }).click();
    await expect(page).toHaveURL(/\/simulasi-kpr$/);
    await expect(page.getByRole("heading", { level: 1, name: "Simulasi KPR" })).toBeVisible();
  });

  test("logo bank rekanan KPR tampil dan termuat", async ({ page }) => {
    await page.goto("/");
    const banks = page.getByRole("list", { name: "Bank rekanan KPR" });
    for (const name of [
      "Bank BTN",
      "Bank Mandiri",
      "Bank Syariah Indonesia (BSI)",
      "Bank Syariah Nasional (BSN)",
    ]) {
      const logo = banks.getByRole("img", { name });
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toBeVisible();
      // Gambar memakai lazy loading: tunggu sampai selesai dimuat, lalu pastikan filenya terbaca.
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
    await expect(nav.getByRole("link", { name: "Proyek" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Kontak" })).toBeVisible();
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
      "Rp 570.000.000",
    );
    // Gambar share bermerek dari route /og (judul, logo, dan foto proyek).
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(new URL(ogImage ?? "").pathname).toBe("/og");
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe(
      "summary_large_image",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    ) as { "@graph": { "@type": string; offers?: { price: number; priceCurrency: string } }[] };
    const listing = jsonLd["@graph"].find((node) => node["@type"] === "RealEstateListing");
    expect(listing?.offers).toEqual(
      expect.objectContaining({ price: 570_000_000, priceCurrency: "IDR" }),
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
