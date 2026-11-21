import { expect, test } from "../fixtures/test";

const STATIC_PAGES = [
  { path: "/", title: /Sejahtera Green Village/ },
  { path: "/proyek", title: "Proyek perumahan | KIS Group" },
  { path: "/simulasi-kpr", title: "Simulasi KPR | KIS Group" },
  { path: "/berita", title: "Berita dan panduan | KIS Group" },
  { path: "/karir", title: "Karir | KIS Group" },
  { path: "/tentang", title: "Tentang kami | KIS Group" },
  { path: "/kontak", title: "Kontak | KIS Group" },
] as const;

test.describe("Judul tab, ikon, dan gambar share", () => {
  for (const { path, title } of STATIC_PAGES) {
    test(`halaman ${path} punya judul tab dan gambar share bermerek yang termuat`, async ({
      page,
      request,
    }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      const og = await page.locator('meta[property="og:image"]').getAttribute("content");
      const ogUrl = new URL(og ?? "");
      expect(ogUrl.pathname).toBe("/og");
      expect(ogUrl.searchParams.get("p")).toBe(path);
      expect(await page.locator('meta[property="og:image:width"]').getAttribute("content")).toBe(
        "1200",
      );
      const twitter = await page.locator('meta[name="twitter:image"]').getAttribute("content");
      expect(new URL(twitter ?? "").pathname).toBe("/og");

      const image = await request.get(`${ogUrl.pathname}${ogUrl.search}`);
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toBe("image/png");
      expect(image.headers()["cache-control"]).toContain("s-maxage");
    });
  }

  test("gambar share hanya untuk halaman terdaftar", async ({ request }) => {
    expect((await request.get("/og?p=%2Fteks-bebas")).status()).toBe(404);
  });

  test("ikon tab, ikon aplikasi, dan apple touch icon tersedia", async ({ page, request }) => {
    await page.goto("/");
    const icon = await page.locator('link[rel="icon"][type="image/png"]').getAttribute("href");
    const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    expect(icon).toBeTruthy();
    expect(apple).toBeTruthy();
    for (const href of [icon, apple, "/favicon.ico"]) {
      const response = await request.get(href ?? "");
      expect(response.status(), `ikon ${href ?? ""}`).toBe(200);
    }
  });
});
