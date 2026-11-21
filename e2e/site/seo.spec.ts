import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures/test";

interface GraphNode {
  "@type": string;
  "@id"?: string;
  author?: { "@id": string };
  publisher?: { "@id": string };
}

async function graphOf(page: Page): Promise<GraphNode[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.flatMap(
    (text) => (JSON.parse(text) as { "@graph"?: GraphNode[] })["@graph"] ?? [],
  );
}

test.describe("SEO lanjutan", () => {
  test("sitemap memuat gambar proyek dan berita", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("<image:image>");
    expect(xml).toMatch(/<image:loc>[^<]*sgv-[^<]*<\/image:loc>/);
  });

  test("Google boleh menampilkan pratinjau gambar besar", async ({ page }) => {
    await page.goto("/");
    const robots = await page.locator('meta[name="googlebot"]').getAttribute("content");
    expect(robots).toContain("max-image-preview:large");
  });

  test("beranda punya node WebSite yang menunjuk ke organisasi", async ({ page }) => {
    await page.goto("/");
    const graph = await graphOf(page);
    const site = graph.find((node) => node["@type"] === "WebSite");
    const org = graph.find((node) => node["@type"] === "RealEstateAgent");
    expect(site?.publisher?.["@id"]).toBe(org?.["@id"]);
  });

  test("artikel menautkan penulis ke organisasi di halaman yang sama dan punya berita lainnya", async ({
    page,
  }) => {
    await page.goto("/berita");
    await page.getByRole("list", { name: "Daftar berita" }).getByRole("link").first().click();
    await expect(page).toHaveURL(/\/berita\/.+/);
    const graph = await graphOf(page);
    const article = graph.find((node) => node["@type"] === "Article");
    const ids = graph.map((node) => node["@id"]);
    expect(ids).toContain(article?.author?.["@id"]);

    const others = page.getByRole("region", { name: "Berita lainnya" });
    await expect(others.getByRole("article")).toHaveCount(3);
    await expect(
      others.getByRole("link", { name: (await page.title()).split(" | ")[0] }),
    ).toHaveCount(0);
  });

  test("detail proyek menautkan penjual ke organisasi di halaman yang sama", async ({ page }) => {
    await page.goto("/proyek/sejahtera-green-village");
    const graph = await graphOf(page);
    expect(graph.map((node) => node["@type"])).toContain("RealEstateAgent");
  });
});
