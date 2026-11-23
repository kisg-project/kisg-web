import { createPortalUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, storageStateFor, test } from "../fixtures/portal";

async function positionId(code: string): Promise<string> {
  const { data } = await adminClient().from("positions").select("id").eq("code", code).single();
  if (!data) throw new Error(`Jabatan ${code} tidak ada.`);
  return data.id;
}

async function activeHolders(code: string, userId: string) {
  const id = await positionId(code);
  const { data } = await adminClient()
    .from("position_holders")
    .select("id")
    .eq("position_id", id)
    .eq("user_id", userId)
    .is("ended_at", null);
  return data ?? [];
}

test.describe("Struktur organisasi", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("lepas, pasang, dan atur pelimpahan jabatan", async ({ page }) => {
    const staff = await createPortalUser({ role: "tax_staff", prefix: "jabatan" });
    expect(await activeHolders("staf_pajak", staff.id)).toHaveLength(1);

    await page.goto("/portal/owner/struktur");
    await expect(
      page.getByRole("heading", { level: 1, name: "Struktur organisasi" }),
    ).toBeVisible();
    const finance = page.getByRole("region", { name: "Keuangan dan akuntansi" });
    const row = finance.getByRole("listitem", { name: "Staf Pajak", exact: true });
    await expect(row.getByRole("list", { name: "Pemegang Staf Pajak" })).toContainText(
      staff.fullName,
    );
    await expectNoA11yViolations(page);
    await expectResponsive(page, page.getByRole("main"));

    await row.getByRole("button", { name: `Lepas ${staff.fullName} dari Staf Pajak` }).click();
    await page
      .getByRole("dialog", { name: `Lepas ${staff.fullName} dari Staf Pajak?` })
      .getByRole("button", { name: "Ya, lepas" })
      .click();
    await expect(page.getByText("Pemegang jabatan dilepas.")).toBeVisible();
    await expect.poll(async () => (await activeHolders("staf_pajak", staff.id)).length).toBe(0);

    await row.getByRole("button", { name: "Pasang Staf Pajak" }).click();
    const assign = page.getByRole("dialog", { name: "Pasang Staf Pajak" });
    await assign.getByRole("button", { name: "Pasang" }).click();
    await expect(assign.getByText("Pilih karyawan.")).toBeVisible();
    await assign.getByRole("combobox", { name: "Karyawan" }).click();
    await page.getByRole("option", { name: staff.fullName }).click();
    await assign.getByRole("button", { name: "Pasang" }).click();
    await expect(page.getByText("Pemegang jabatan tersimpan.")).toBeVisible();
    await expect.poll(async () => (await activeHolders("staf_pajak", staff.id)).length).toBe(1);

    const pajakId = await positionId("staf_pajak");
    try {
      await row.getByRole("button", { name: "Pelimpahan Staf Pajak" }).click();
      const delegate = page.getByRole("dialog", { name: "Pelimpahan Staf Pajak" });
      await delegate.getByRole("combobox", { name: "Dipegang oleh" }).click();
      await page.getByRole("option", { name: "Staf Akuntansi" }).click();
      await delegate.getByRole("button", { name: "Simpan" }).click();
      await expect(page.getByText("Pelimpahan tersimpan.")).toBeVisible();
      await expect(row.getByText("Pelimpahan saat kosong: Staf Akuntansi")).toBeVisible();
      const { data } = await adminClient()
        .from("positions")
        .select("delegate_to_id")
        .eq("id", pajakId)
        .single();
      expect(data?.delegate_to_id).toBe(await positionId("staf_akuntansi"));
    } finally {
      await adminClient().from("positions").update({ delegate_to_id: null }).eq("id", pajakId);
    }
  });

  test("jabatan kosong ditandai dan tugasnya tampil di beranda atasan", async ({
    page,
    browser,
  }) => {
    const drafterId = await positionId("drafter");
    const { data: before } = await adminClient()
      .from("position_holders")
      .select("id")
      .eq("position_id", drafterId)
      .is("ended_at", null);
    const ids = (before ?? []).map((row) => row.id);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    try {
      if (ids.length > 0) {
        await adminClient().from("position_holders").update({ ended_at: today }).in("id", ids);
      }
      await page.goto("/portal/owner/struktur");
      const row = page
        .getByRole("region", { name: "Teknik dan konstruksi" })
        .getByRole("listitem", { name: "Drafter atau Arsitek", exact: true });
      await expect(row.getByText("Kosong", { exact: true })).toBeVisible();
      await expect(row.getByText(/Tugas dipegang .+\(Manajer Proyek\)/)).toBeVisible();

      const context = await browser.newContext({
        storageState: storageStateFor("project_manager"),
      });
      const manager = await context.newPage();
      await manager.goto("/portal/beranda");
      const duties = manager.getByRole("region", { name: "Tugas jabatan yang belum terisi" });
      await expect(duties).toContainText("Drafter atau Arsitek");
      await context.close();
    } finally {
      if (ids.length > 0) {
        await adminClient().from("position_holders").update({ ended_at: null }).in("id", ids);
      }
    }
  });
});
