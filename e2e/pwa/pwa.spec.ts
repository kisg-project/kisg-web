import { expect, expectNoA11yViolations, expectResponsive, test } from "../fixtures/test";

// PWA portal di production build (CLAUDE.md bagian 5: service worker hanya benar di production build).
// CI tanpa PORTAL_HOST, jadi portal di /portal. Pemetaan subdomain diuji unit (portal-host.test.ts).

test.describe("PWA portal", () => {
  test("manifest bisa dipasang: nama, start_url, scope, ikon", async ({ request, page }) => {
    const response = await request.get("/portal/manifest.webmanifest");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/manifest+json");
    const manifest = (await response.json()) as {
      name: string;
      start_url: string;
      scope: string;
      display: string;
      icons: { src: string; purpose: string }[];
    };
    expect(manifest).toMatchObject({
      name: "KIS Group Operasional",
      start_url: "/portal/",
      scope: "/portal/",
      display: "standalone",
    });
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status(), icon.src).toBe(200);
    }
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

    await page.goto("/portal/login");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/portal/manifest.webmanifest",
    );
  });

  test("service worker disajikan dengan scope portal dan tanpa cache", async ({ request }) => {
    const response = await request.get("/portal/sw.js");
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["content-type"]).toContain("javascript");
    expect(headers["service-worker-allowed"]).toBe("/portal/");
    expect(headers["cache-control"]).toContain("no-store");
  });

  test("halaman offline tanpa login, aksesibel, dan responsif", async ({ page }) => {
    await page.goto("/portal/offline");
    await expect(
      page.getByRole("heading", { level: 1, name: "Anda sedang offline" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Muat ulang" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test.describe("mode offline", () => {
    // Navigasi saat offline membuat browser mencatat gagal muat di console. Itu memang diharapkan.
    test.use({ allowedConsoleErrors: [/ERR_INTERNET_DISCONNECTED|Failed to load resource/] });

    test("setelah service worker aktif, halaman portal saat offline menampilkan halaman offline", async ({
      page,
      context,
      browserName,
    }) => {
      test.skip(
        browserName !== "chromium",
        "Playwright hanya mendukung service worker di Chromium",
      );
      await page.goto("/portal/login");
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await context.setOffline(true);
      await page.goto("/portal/lupa-password").catch(() => undefined);
      await expect(
        page.getByRole("heading", { level: 1, name: "Anda sedang offline" }),
      ).toBeVisible();
      // Halaman offline memberi jalan keluar yang jelas. Isi halaman setelah online tidak diuji di
      // sini: di Playwright, request service worker menggantung setelah emulasi offline dimatikan
      // (keterbatasan alat uji). Strategi navigasi network-first ada di
      // src/features/pwa/service-worker.ts dan tombol memanggil window.location.reload().
      await expect(page.getByRole("button", { name: "Muat ulang" })).toBeEnabled();
      await context.setOffline(false);
    });
  });
});
