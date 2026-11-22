import type { Page } from "@playwright/test";
import type { AppRole } from "../../src/config/roles";
import { expect, storageStateFor, test } from "../fixtures/portal";

const WIDTHS = { hp: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } } as const;

const PAGES: Record<string, { role: AppRole; path: string }[]> = {
  owner: [
    { role: "owner", path: "/portal/owner" },
    { role: "owner", path: "/portal/owner/absensi" },
    { role: "owner", path: "/portal/owner/karyawan" },
    { role: "owner", path: "/portal/owner/titik-absensi" },
    { role: "owner", path: "/portal/owner/jam-kerja" },
    { role: "owner", path: "/portal/akun" },
  ],
  marketing: [
    { role: "marketing", path: "/portal/crm" },
    { role: "marketing", path: "/portal/absensi" },
  ],
  lapangan: [{ role: "site_supervisor", path: "/portal/lapangan" }],
  cms: [
    { role: "cms", path: "/cms" },
    { role: "cms", path: "/cms/berita" },
  ],
};

const slug = (path: string) => path.replace(/^\/portal\/?/, "").replaceAll("/", "-") || "beranda";

async function capture(page: Page, name: string) {
  for (const [label, size] of Object.entries(WIDTHS)) {
    await page.setViewportSize(size);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${name} ${label} tanpa scroll horizontal`).toBeLessThanOrEqual(0);
    await expect(page.locator('[data-lottie="memuat"]')).toHaveCount(0);
    await page.screenshot({
      path: `test-results/tampilan/${name}-${label}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}

for (const [group, pages] of Object.entries(PAGES)) {
  const role = pages[0]?.role ?? "owner";
  test.describe(`Foto tampilan ${group}`, () => {
    test.use({ storageState: storageStateFor(role) });

    for (const { path } of pages) {
      test(`memotret ${path}`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(path);
        await capture(page, `${group}-${slug(path)}`);
      });
    }
  });
}

test.describe("Foto dialog", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("memotret dialog tambah titik absensi", async ({ page }) => {
    await page.goto("/portal/owner/titik-absensi");
    await page.getByRole("button", { name: "Tambah titik absensi" }).click();
    const dialog = page.getByRole("dialog", { name: "Tambah titik absensi" });
    await expect(dialog).toBeVisible();
    for (const [label, size] of Object.entries(WIDTHS)) {
      await page.setViewportSize(size);
      await page.screenshot({
        path: `test-results/tampilan/dialog-titik-absensi-${label}.png`,
        animations: "disabled",
      });
    }
  });
});

test.describe("Foto halaman masuk", () => {
  for (const path of ["/portal/login", "/portal/lupa-password"]) {
    test(`memotret ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await capture(page, `masuk-${slug(path)}`);
    });
  }
});
