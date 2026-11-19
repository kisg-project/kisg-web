import { expect, expectNoA11yViolations, expectResponsive, test } from "../fixtures/test";

test.describe("Halaman review UI", () => {
  test("menampilkan token dan komponen tanpa pelanggaran aksesibilitas", async ({ page }) => {
    await page.goto("/dev/ui");
    await expect(page.getByRole("heading", { level: 1, name: "Review UI" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { name: "Skala warna" })).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "KPR konvensional" }).getByLabel("Harga rumah"),
    ).toBeEnabled();
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("dialog dan toast bekerja dengan keyboard", async ({ page }) => {
    await page.goto("/dev/ui");
    await page.getByRole("button", { name: "Buka dialog" }).click();
    const dialog = page.getByRole("dialog", { name: "Contoh dialog" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Tampilkan toast" }).click();
    await expect(page.getByText("Laporan tersimpan.")).toBeVisible();
  });
});
