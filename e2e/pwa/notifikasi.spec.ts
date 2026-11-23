import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { createPortalUser, type TestUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, test } from "../fixtures/portal";

async function addNotification(
  userId: string,
  values: { title: string; href?: string; body?: string },
): Promise<string> {
  const { data, error } = await adminClient()
    .from("notifications")
    .insert({
      user_id: userId,
      kind: "sidik_jari_direset",
      title: values.title,
      body: values.body ?? "",
      href: values.href ?? "/portal/akun",
      dedupe_key: `uji-${randomUUID()}`,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Gagal membuat notifikasi test: ${error.message}`);
  return data.id;
}

async function readAt(id: string): Promise<string | null> {
  const { data } = await adminClient()
    .from("notifications")
    .select("read_at")
    .eq("id", id)
    .single();
  return data?.read_at ?? null;
}

async function login(page: Page, user: TestUser) {
  await page.goto("/portal/login");
  await loginViaForm(page, user);
  await expect(page).toHaveURL("/portal/owner");
}

test.describe("Notifikasi portal", () => {
  test("lonceng menghitung yang belum dibaca, membuka notifikasi menandai dibaca", async ({
    page,
  }) => {
    const owner = await createPortalUser({ role: "owner", prefix: "lonceng" });
    const first = await addNotification(owner.id, {
      title: "Sidik jari Anda direset",
      body: "Daftarkan ulang di Akun saya.",
    });
    const second = await addNotification(owner.id, { title: "Pengajuan baru masuk" });
    await login(page, owner);

    const bell = page.getByRole("link", { name: "Notifikasi, 2 belum dibaca" });
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(page).toHaveURL("/portal/notifikasi");
    await expect(page.getByRole("heading", { name: "Notifikasi", level: 1 })).toBeVisible();
    const list = page.getByRole("list", { name: "Daftar notifikasi" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expectNoA11yViolations(page);
    await expectResponsive(page, page.getByRole("main"));

    await list.getByRole("button", { name: /Sidik jari Anda direset/ }).click();
    await expect(page).toHaveURL("/portal/akun");
    await expect.poll(() => readAt(first)).not.toBeNull();
    await expect(page.getByRole("link", { name: "Notifikasi, 1 belum dibaca" })).toBeVisible();

    await page.goto("/portal/notifikasi");
    await page.getByRole("button", { name: "Tandai semua dibaca" }).click();
    await expect(page.getByText("Semua notifikasi sudah dibaca.")).toBeVisible();
    await expect.poll(() => readAt(second)).not.toBeNull();
    await expect(page.getByRole("link", { name: "Notifikasi", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toBeDisabled();
  });

  test("notifikasi baru muncul di lonceng tanpa memuat ulang", async ({ page }) => {
    const owner = await createPortalUser({ role: "owner", prefix: "lonceng-langsung" });
    await login(page, owner);
    await expect(page.getByRole("link", { name: "Notifikasi", exact: true })).toBeVisible();
    await expect(page.locator("html[data-langsung=siap]")).toHaveCount(1, { timeout: 15_000 });
    await addNotification(owner.id, { title: "Pengajuan absen baru" });
    await expect(page.getByRole("link", { name: "Notifikasi, 1 belum dibaca" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("halaman kosong dan notifikasi orang lain tidak terlihat", async ({ page }) => {
    const owner = await createPortalUser({ role: "owner", prefix: "lonceng-kosong" });
    const other = await createPortalUser({ role: "owner", prefix: "lonceng-lain" });
    await addNotification(other.id, { title: "Rahasia akun lain" });
    await login(page, owner);
    await page.goto("/portal/notifikasi");
    await expect(page.getByText("Belum ada notifikasi")).toBeVisible();
    await expect(page.getByText("Rahasia akun lain")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tandai semua dibaca" })).toBeDisabled();
    await expectNoA11yViolations(page);
  });

  test("Akun saya menampilkan status notifikasi HP", async ({ page }) => {
    const owner = await createPortalUser({ role: "owner", prefix: "notif-hp" });
    await login(page, owner);
    await page.goto("/portal/akun");
    const section = page.getByRole("region", { name: "Notifikasi HP" });
    await expect(
      section.getByText(
        "Notifikasi HP belum tersedia. Notifikasi tetap masuk ke lonceng dan email.",
      ),
    ).toBeVisible();
  });
});
