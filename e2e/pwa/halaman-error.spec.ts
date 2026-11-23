import { expectNoA11yViolations, expectNotFound, expectResponsive } from "../fixtures/test";
import { expect, storageStateFor, test } from "../fixtures/portal";

test.describe("Halaman error portal", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("alamat yang tidak ada memakai 404 bergaya portal di dalam shell", async ({
    page,
    consoleErrors,
  }) => {
    await page.goto("/portal/halaman-yang-tidak-ada");
    await expectNotFound(page, consoleErrors);
    await expect(page.getByText("Kode 404")).toBeVisible();
    await expect(page.getByRole("link", { name: "Notifikasi", exact: false })).toBeVisible();
    await page.getByRole("link", { name: "Ke beranda" }).click();
    await expect(page).toHaveURL("/portal/owner");
    await page.goto("/portal/halaman-yang-tidak-ada");
    await expectNotFound(page, consoleErrors);
    await expectNoA11yViolations(page);
    await expectResponsive(page, page.getByRole("main"));
  });

  test("grid shortcut hanya berisi fitur yang sudah bisa dipakai", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/portal/owner");
    const grid = page.getByRole("list", { name: "Modul owner" });
    await expect(grid.getByRole("link").first()).toBeVisible();
    await expect(grid.getByText("Segera")).toHaveCount(0);
  });
});

test.describe("Halaman error CMS", () => {
  test.use({ storageState: storageStateFor("cms") });

  test("alamat yang tidak ada memakai 404 bergaya CMS", async ({ page, consoleErrors }) => {
    await page.goto("/cms/halaman-yang-tidak-ada");
    await expectNotFound(page, consoleErrors);
    await expect(page.getByRole("link", { name: "Ke ringkasan" })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
