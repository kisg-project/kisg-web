import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations } from "../fixtures/test";
import { expect, storageStateFor, test } from "../fixtures/portal";

test.describe("Jam kerja per role", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("marketing masuk hari Minggu, tambah lalu hapus jam kerja role", async ({ page }) => {
    await page.goto("/portal/owner/jam-kerja");
    const list = page.getByRole("list", { name: "Daftar jam khusus" });
    const marketing = list.getByRole("listitem", { name: "Marketing", exact: true });
    await expect(marketing).toContainText("09:00 sampai 17:00");
    await expect(marketing).toContainText("Minggu");

    await page.getByRole("button", { name: "Tambah jam khusus" }).click();
    const form = page
      .getByRole("dialog", { name: "Tambah jam khusus" })
      .getByRole("form", { name: "Jam kerja khusus" });
    await form.getByRole("combobox", { name: "Berlaku untuk" }).click();
    await page.getByRole("option", { name: "Per role" }).click();
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form.getByText("Pilih role.")).toBeVisible();
    await form.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Keuangan" }).click();
    await form.getByLabel("Jam masuk").fill("08:30");
    await form.getByLabel("Jam pulang").fill("16:30");
    await expectNoA11yViolations(page);
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Jam kerja tersimpan.")).toBeVisible();

    const finance = list.getByRole("listitem", { name: "Keuangan", exact: true });
    await expect(finance).toContainText("08:30 sampai 16:30");
    const { data } = await adminClient()
      .from("work_schedules")
      .select("scope, start_time, end_time")
      .eq("role", "finance")
      .single();
    expect(data).toMatchObject({ scope: "role", start_time: "08:30:00", end_time: "16:30:00" });

    await finance.getByRole("button", { name: "Hapus jam kerja Keuangan" }).click();
    await page
      .getByRole("dialog", { name: "Hapus jam kerja Keuangan?" })
      .getByRole("button", { name: "Ya, hapus" })
      .click();
    await expect(page.getByText("Jam kerja khusus dihapus.")).toBeVisible();
    await expect(finance).toHaveCount(0);
    await expect
      .poll(async () => {
        const { data: gone } = await adminClient()
          .from("work_schedules")
          .select("id")
          .eq("role", "finance");
        return gone;
      })
      .toEqual([]);
  });
});
