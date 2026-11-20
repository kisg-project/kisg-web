import { createPortalUser, E2E_PASSWORD, uniqueEmail } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, storageStateFor, test } from "../fixtures/portal";

async function roleOf(userId: string) {
  const { data } = await adminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

test.describe("Kelola pengguna (admin)", () => {
  test.use({ storageState: storageStateFor("admin") });

  test("halaman pengguna dari menu admin: axe dan responsif", async ({ page }) => {
    await page.goto("/portal/admin");
    await page.getByRole("link", { name: /Pengguna/ }).click();
    await expect(page).toHaveURL("/portal/admin/pengguna");
    await expect(page.getByRole("heading", { level: 1, name: "Pengguna" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("undang karyawan: tautan undangan membuat password dan masuk dengan role yang dipilih", async ({
    page,
    browser,
  }) => {
    const email = uniqueEmail("undangan");
    await page.goto("/portal/admin/pengguna");
    const form = page.getByRole("form", { name: "Undang pengguna" });
    await form.getByLabel("Nama lengkap").fill("Karyawan Undangan");
    await form.getByLabel("Email").fill(email);
    await form.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Pengawas lapangan" }).click();
    await form.getByRole("button", { name: "Buat undangan" }).click();

    const status = page.getByRole("status").filter({ hasText: `Undangan untuk ${email}` });
    await expect(status).toBeVisible();
    const link = (await status.locator("code").textContent()) ?? "";
    expect(link).toContain("/portal/auth/confirm?token_hash=");

    const { data: profile } = await adminClient()
      .from("profiles")
      .select("id, full_name")
      .eq("email", email)
      .single();
    expect(profile?.full_name).toBe("Karyawan Undangan");
    expect(await roleOf(profile?.id ?? "")).toBe("site_supervisor");

    // Karyawan membuka tautan di perangkatnya sendiri (tanpa sesi admin).
    const context = await browser.newContext({ storageState: undefined });
    const invitee = await context.newPage();
    await invitee.goto(link);
    await expect(invitee).toHaveURL("/portal/reset-password");
    await invitee.getByLabel("Password baru", { exact: true }).fill(E2E_PASSWORD);
    await invitee.getByLabel("Ulangi password baru").fill(E2E_PASSWORD);
    await invitee.getByRole("button", { name: "Simpan password" }).click();
    await expect(invitee).toHaveURL("/portal/lapangan");
    await context.close();
  });

  test("email yang sudah terdaftar ditolak dengan pesan jelas", async ({ page }) => {
    const existing = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/admin/pengguna");
    const form = page.getByRole("form", { name: "Undang pengguna" });
    await form.getByLabel("Nama lengkap").fill("Duplikat");
    await form.getByLabel("Email").fill(existing.email);
    await form.getByRole("button", { name: "Buat undangan" }).click();
    await expect(form.getByRole("alert")).toHaveText(/Email sudah terdaftar/);
  });

  test("ubah role dan nonaktifkan akun, tercatat di database dan diblokir di Auth", async ({
    page,
  }) => {
    const target = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/admin/pengguna");
    const card = page.getByRole("listitem", { name: target.fullName });

    await card.getByRole("combobox", { name: `Role ${target.fullName}` }).click();
    await page.getByRole("option", { name: "Keuangan" }).click();
    await expect.poll(() => roleOf(target.id)).toBe("finance");

    await card.getByRole("button", { name: "Nonaktifkan" }).click();
    await expect(card.getByText("Nonaktif", { exact: true })).toBeVisible();
    const { data: profile } = await adminClient()
      .from("profiles")
      .select("is_active")
      .eq("id", target.id)
      .single();
    expect(profile?.is_active).toBe(false);
    const { data: auth } = await adminClient().auth.admin.getUserById(target.id);
    expect(auth.user?.banned_until).toBeTruthy();

    await card.getByRole("button", { name: "Aktifkan" }).click();
    await expect(card.getByText("Nonaktif", { exact: true })).toBeHidden();
    const { data: restored } = await adminClient().auth.admin.getUserById(target.id);
    expect(restored.user?.banned_until ?? null).toBeNull();
  });

  test("admin tidak bisa mengubah akunnya sendiri atau akun owner", async ({ page }) => {
    const owner = await createPortalUser({ role: "owner" });
    await page.goto("/portal/admin/pengguna");
    const ownerCard = page.getByRole("listitem", { name: owner.fullName });
    await expect(ownerCard.getByRole("button", { name: "Nonaktifkan" })).toBeDisabled();
    await expect(ownerCard.getByRole("combobox")).toBeDisabled();
    const selfCard = page.getByRole("listitem").filter({ hasText: "Anda" });
    await expect(selfCard.getByRole("button", { name: "Nonaktifkan" })).toBeDisabled();
  });
});

test.describe("Kelola pengguna (owner)", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("owner boleh mengubah akun owner lain", async ({ page }) => {
    const otherOwner = await createPortalUser({ role: "owner" });
    await page.goto("/portal/admin/pengguna");
    const card = page.getByRole("listitem", { name: otherOwner.fullName });
    await expect(card.getByRole("button", { name: "Nonaktifkan" })).toBeEnabled();
  });
});
