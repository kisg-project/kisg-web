import { createPortalUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations } from "../fixtures/test";
import { expect, loginViaForm, test } from "../fixtures/portal";

test.describe("Shortcut beranda", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sembunyikan dan urutkan shortcut, tersimpan di akun", async ({ page }) => {
    const owner = await createPortalUser({ role: "owner", prefix: "pintasan" });
    await page.goto("/portal/login");
    await loginViaForm(page, owner);
    await expect(page).toHaveURL("/portal/owner");

    const grid = page.getByRole("list", { name: "Modul owner" });
    await expect(grid.getByRole("link", { name: "Karyawan" })).toBeVisible();

    await page.getByRole("button", { name: "Atur" }).click();
    const dialog = page.getByRole("dialog", { name: "Atur shortcut" });
    await expect(dialog).toBeVisible();
    await expectNoA11yViolations(page);
    await dialog.getByRole("switch", { name: "Tampilkan Karyawan" }).click();
    await dialog.getByRole("button", { name: "Naikkan Jam kerja" }).click();
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Shortcut tersimpan.")).toBeVisible();

    await expect(grid.getByRole("link", { name: "Karyawan" })).toHaveCount(0);
    const labels = await grid.getByRole("link").allInnerTexts();
    expect(labels.indexOf("Jam kerja")).toBeLessThan(labels.indexOf("Titik absensi"));

    await page.reload();
    await expect(grid.getByRole("link", { name: "Karyawan" })).toHaveCount(0);

    const { data } = await adminClient().auth.admin.getUserById(owner.id);
    const prefs = data.user?.user_metadata.portal_shortcuts as
      { order: string[]; hidden: string[] } | undefined;
    expect(prefs?.hidden).toContain("/portal/owner/karyawan");
    expect(prefs?.order.indexOf("/portal/owner/jam-kerja")).toBeLessThan(
      prefs?.order.indexOf("/portal/owner/titik-absensi") ?? -1,
    );

    await page.getByRole("button", { name: "Atur" }).click();
    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();
  });
});
