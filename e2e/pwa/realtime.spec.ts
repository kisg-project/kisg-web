import { createPortalUser } from "../factories/users";
import { expect, storageStateFor, test } from "../fixtures/portal";

test.describe("Portal realtime", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("karyawan baru muncul di daftar tanpa memuat ulang halaman", async ({ page }) => {
    await page.goto("/portal/owner/karyawan");
    const list = page.getByRole("list", { name: "Daftar karyawan" });
    await expect(list).toBeVisible();
    await expect(page.locator("html[data-langsung=siap]")).toHaveCount(1, { timeout: 15_000 });
    const user = await createPortalUser({ role: "marketing", prefix: "langsung" });
    await expect(list.getByRole("listitem", { name: user.fullName })).toBeVisible({
      timeout: 20_000,
    });
  });
});
