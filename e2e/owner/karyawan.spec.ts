import path from "node:path";
import type { Page } from "@playwright/test";
import { completeProfile, createPortalUser, E2E_PASSWORD, uniqueEmail } from "../factories/users";
import { codeFrom, linkFrom, waitForEmail } from "../fixtures/mailpit";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, storageStateFor, test } from "../fixtures/portal";

const PHOTO = path.join(process.cwd(), "e2e", "fixtures", "files", "exif-gps-rotated.jpg");
const INVITE_SUBJECT = "Undangan akun KIS Operasional";

async function rolesOf(userId: string) {
  const { data } = await adminClient()
    .from("user_roles")
    .select("role, is_primary")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false });
  return (data ?? []).map((row) => `${row.role}${row.is_primary ? "*" : ""}`);
}

async function profileOf(email: string) {
  const { data } = await adminClient()
    .from("profiles")
    .select("id, full_name, phone, avatar_path, activated_at, needs_password, invited_at")
    .eq("email", email)
    .single();
  if (!data) throw new Error(`Profil ${email} tidak ditemukan.`);
  return data;
}

/** Owner mengisi form undangan: nama, email, dan daftar role (role pertama jadi role utama). */
async function invite(page: Page, input: { name: string; email: string; roles: string[] }) {
  await page.goto("/portal/owner/karyawan");
  const form = page.getByRole("form", { name: "Undang karyawan" });
  await form.getByLabel("Nama lengkap").fill(input.name);
  await form.getByLabel("Email").fill(input.email);
  // Default form mencentang Marketing. Lepas dulu kalau tidak dipilih.
  if (!input.roles.includes("Marketing"))
    await form.getByLabel("Marketing", { exact: true }).uncheck();
  for (const role of input.roles) await form.getByLabel(role, { exact: true }).check();
  const [primary] = input.roles;
  if (input.roles.length > 1 && primary) {
    await form.getByRole("combobox", { name: "Role utama" }).click();
    await page.getByRole("option", { name: primary }).click();
  }
  await form.getByRole("button", { name: "Kirim undangan" }).click();
}

test.describe("Karyawan (owner)", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("halaman karyawan dari beranda owner: axe dan responsif", async ({ page }) => {
    await page.goto("/portal/owner");
    await page.getByRole("link", { name: /Karyawan/ }).click();
    await expect(page).toHaveURL("/portal/owner/karyawan");
    await expect(page.getByRole("heading", { level: 1, name: "Karyawan" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("undangan rangkap jabatan terkirim ke email, aktivasi lengkap, lalu masuk dengan menu gabungan", async ({
    page,
    browser,
  }) => {
    const email = uniqueEmail("undangan");
    await invite(page, {
      name: "Rina Rangkap",
      email,
      roles: ["Pengawas lapangan", "Marketing"],
    });
    await expect(
      page.getByRole("status").filter({ hasText: `Undangan terkirim ke ${email}` }),
    ).toBeVisible();

    const profile = await profileOf(email);
    expect(profile.needs_password).toBe(true);
    expect(profile.activated_at).toBeNull();
    expect(profile.invited_at).not.toBeNull();
    expect(await rolesOf(profile.id)).toEqual(["site_supervisor*", "marketing"]);

    // Email berkop dengan tombol aktivasi dan versi teks.
    const mail = await waitForEmail(email, INVITE_SUBJECT);
    expect(mail.html).toContain("Aktifkan akun");
    expect(mail.html).toContain("/brand/logo-kis.png");
    expect(mail.text).toContain("Pengawas lapangan, Marketing");
    const link = linkFrom(mail, "/portal/auth/confirm");

    // Karyawan membuka tautan di perangkatnya sendiri.
    const context = await browser.newContext({ storageState: undefined });
    const invitee = await context.newPage();
    await invitee.goto(link);
    await expect(invitee).toHaveURL("/portal/aktivasi");
    await expect(invitee.getByRole("heading", { level: 1, name: "Aktifkan akun" })).toBeVisible();
    await expectNoA11yViolations(invitee);

    const form = invitee.getByRole("form", { name: "Aktivasi akun" });
    // Tanpa foto, tanpa password: ditolak dengan pesan jelas.
    await form.getByRole("button", { name: "Aktifkan akun" }).click();
    await expect(form.getByText("Buat password untuk akun Anda.")).toBeVisible();

    await form.getByLabel("Pilih dari galeri").setInputFiles(PHOTO);
    await expect(form.getByText("Foto profil tersimpan.")).toBeVisible();
    await form.getByLabel("Nomor HP (WhatsApp)").fill("0812 7777 1234");
    await form.getByLabel("Password baru", { exact: true }).fill(E2E_PASSWORD);
    await expect(form.getByText(/Kekuatan:/)).toBeVisible();
    await form.getByLabel("Ulangi password", { exact: true }).fill(E2E_PASSWORD);
    await form.getByRole("button", { name: "Aktifkan akun" }).click();
    await expect(invitee).toHaveURL("/portal/lapangan");

    const activated = await profileOf(email);
    expect(activated.activated_at).not.toBeNull();
    expect(activated.needs_password).toBe(false);
    expect(activated.phone).toBe("+6281277771234");
    expect(activated.avatar_path).toMatch(new RegExp(`^${activated.id}/.+\\.(webp|jpg)$`));
    const { data: stored } = await adminClient()
      .storage.from("avatars")
      .download(activated.avatar_path ?? "");
    expect(stored?.size ?? 0).toBeGreaterThan(0);
    expect(stored?.size ?? Infinity).toBeLessThanOrEqual(100 * 1024);

    // Menu gabungan dua role.
    const desktop = (invitee.viewportSize()?.width ?? 0) >= 1024;
    const nav = invitee.getByRole("navigation", {
      name: desktop ? "Menu portal" : "Menu portal bawah",
      exact: true,
    });
    await expect(nav.getByRole("link", { name: "Lapangan", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "CRM", exact: true })).toBeVisible();
    await context.close();
  });

  test("email terdaftar ditolak dengan pesan jelas", async ({ page }) => {
    const existing = await createPortalUser({ role: "marketing" });
    await invite(page, { name: "Duplikat", email: existing.email, roles: ["Marketing"] });
    await expect(page.getByRole("form", { name: "Undang karyawan" }).getByRole("alert")).toHaveText(
      /Email sudah terdaftar/,
    );
  });

  test("kirim ulang dan batalkan undangan yang belum diaktivasi", async ({ page }) => {
    const email = uniqueEmail("ulang");
    await invite(page, { name: "Undangan Ulang", email, roles: ["Keuangan"] });
    await expect(page.getByRole("status").filter({ hasText: email })).toBeVisible();
    await page.reload();

    const card = page.getByRole("listitem", { name: "Undangan Ulang" });
    await expect(card.getByText("Menunggu aktivasi")).toBeVisible();
    await card.getByRole("button", { name: "Kirim ulang undangan" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: `Undangan terkirim ke ${email}` }),
    ).toBeVisible();

    const { id } = await profileOf(email);
    await page
      .getByRole("listitem", { name: "Undangan Ulang" })
      .getByRole("button", { name: "Batalkan undangan" })
      .click();
    await expect(page.getByRole("listitem", { name: "Undangan Ulang" })).toHaveCount(0);
    const { data } = await adminClient().auth.admin.getUserById(id);
    expect(data.user).toBeNull();
  });

  test("ubah role menjadi rangkap jabatan, nonaktifkan, lalu aktifkan lagi", async ({ page }) => {
    const target = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/owner/karyawan");
    const card = page.getByRole("listitem", { name: target.fullName });

    await card.getByRole("button", { name: "Ubah role" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Keuangan", { exact: true }).check();
    await dialog.getByRole("combobox", { name: "Role utama" }).click();
    await page.getByRole("option", { name: "Keuangan" }).click();
    await dialog.getByRole("button", { name: "Simpan role" }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => rolesOf(target.id)).toEqual(["finance*", "marketing"]);
    await expect(card.getByRole("list", { name: `Role ${target.fullName}` })).toContainText(
      "Keuangan (utama)",
    );

    await card.getByRole("button", { name: "Nonaktifkan" }).click();
    await expect(card.getByText("Nonaktif", { exact: true })).toBeVisible();
    const { data: banned } = await adminClient().auth.admin.getUserById(target.id);
    expect(banned.user?.banned_until).toBeTruthy();

    await card.getByRole("button", { name: "Aktifkan" }).click();
    await expect(card.getByText("Nonaktif", { exact: true })).toBeHidden();
  });

  test("owner tidak bisa mengubah akunnya sendiri, role admin tidak bisa dipilih", async ({
    page,
  }) => {
    await page.goto("/portal/owner/karyawan");
    const self = page.getByRole("listitem").filter({ hasText: "Anda" });
    await expect(self.getByRole("button", { name: "Nonaktifkan" })).toBeDisabled();
    await expect(self.getByRole("button", { name: "Ubah role" })).toBeDisabled();
    const form = page.getByRole("form", { name: "Undang karyawan" });
    await expect(form.getByLabel("Admin", { exact: true })).toHaveCount(0);
    await expect(form.getByLabel("Owner", { exact: true })).toBeVisible();
  });
});

test.describe("Aktivasi dan Akun saya", () => {
  test("akun tanpa foto profil diarahkan ke aktivasi sebelum memakai modul", async ({ page }) => {
    const user = await createPortalUser({ role: "marketing", complete: false });
    await page.goto("/portal/login");
    await loginViaForm(page, user);
    // Login mengarah ke beranda marketing, lalu layout portal mengalihkan ke aktivasi.
    await expect(page).toHaveURL("/portal/aktivasi");
    await page.goto("/portal/crm");
    await expect(page).toHaveURL("/portal/aktivasi");
    // Akun lama sudah punya password: bagian password opsional.
    await expect(page.getByText("Ganti password (opsional)")).toBeVisible();
    await completeProfile(user.id);
    await page.goto("/portal/aktivasi");
    await expect(page).toHaveURL("/portal/crm");
  });

  test("Akun saya: ubah nama dan nomor HP, ganti password dengan password lama", async ({
    page,
    browser,
  }) => {
    const user = await createPortalUser({ role: "finance" });
    await page.goto("/portal/login");
    await loginViaForm(page, user);
    await page.getByRole("link", { name: /Akun saya/ }).click();
    await expect(page).toHaveURL("/portal/akun");
    await expectNoA11yViolations(page);

    const data = page.getByRole("form", { name: "Data diri" });
    await data.getByLabel("Nama lengkap").fill("Fina Keuangan");
    await data.getByLabel("Nomor HP (WhatsApp)").fill("081299998888");
    await data.getByRole("button", { name: "Simpan data diri" }).click();
    await expect(page.getByText("Data diri tersimpan.")).toBeVisible();
    await expect.poll(async () => (await profileOf(user.email)).full_name).toBe("Fina Keuangan");

    // Ganti password dengan kode dari email (OTP), bukan password lama.
    await page.getByRole("button", { name: "Kirim kode ke email" }).click();
    const password = page.getByRole("form", { name: "Ganti password" });
    await expect(password.getByRole("status")).toContainText(user.email);
    const mail = await waitForEmail(user.email, "Kode password akun KIS Group");
    const code = codeFrom(mail);
    const next = "BaruRahasia2027";
    await password.getByLabel("Kode dari email").fill(code === "000000" ? "111111" : "000000");
    await password.getByLabel("Password baru", { exact: true }).fill(next);
    await password.getByLabel("Ulangi password baru", { exact: true }).fill(next);
    await password.getByRole("button", { name: "Ganti password" }).click();
    await expect(password.getByRole("alert")).toHaveText(
      "Kode salah atau sudah tidak berlaku. Minta kode baru.",
    );

    await password.getByLabel("Kode dari email").fill(code);
    await password.getByRole("button", { name: "Ganti password" }).click();
    await expect(page.getByText(/Password diganti/)).toBeVisible();

    const context = await browser.newContext({ storageState: undefined });
    const fresh = await context.newPage();
    await fresh.goto("/portal/login");
    await loginViaForm(fresh, { email: user.email, password: next });
    await expect(fresh).toHaveURL("/portal/crm");
    await context.close();
  });

  test("halaman masuk tanpa tombol daftar atau login Google", async ({ page }) => {
    await page.goto("/portal/login");
    await expect(page.getByRole("link", { name: "Lupa password" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Daftar|Buat akun/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Google/i })).toHaveCount(0);
  });
});
