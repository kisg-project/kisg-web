import { randomUUID } from "node:crypto";
import { createPortalUser } from "../factories/users";
import { countEmails, linkFrom, waitForEmail } from "../fixtures/mailpit";
import { expectNoA11yViolations } from "../fixtures/test";
import { expect, loginViaForm, test } from "../fixtures/portal";

const RESET_SUBJECT = "Atur ulang password portal KIS Group";
const SENT_MESSAGE = /Kalau email itu terdaftar, tautan atur ulang password sudah dikirim/;

test.describe("Lupa password", () => {
  test("atur ulang lewat tautan email, lalu masuk dengan password baru", async ({ page }) => {
    const user = await createPortalUser({ role: "site_supervisor" });

    await page.goto("/portal/login");
    await page.getByRole("link", { name: "Lupa password" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Lupa password" })).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByLabel("Email akun portal").fill(user.email);
    await page.getByRole("button", { name: "Kirim tautan" }).click();
    await expect(page.getByRole("status")).toContainText(SENT_MESSAGE);

    const email = await waitForEmail(user.email, RESET_SUBJECT);
    const link = linkFrom(email, "/portal/auth/confirm");
    expect(link).toContain("type=recovery");
    await page.goto(link);

    await expect(page).toHaveURL("/portal/reset-password");
    await expect(page.getByRole("heading", { level: 1, name: "Buat password baru" })).toBeVisible();
    await expectNoA11yViolations(page);

    // Aturan password dicek sebelum dikirim.
    await page.getByLabel("Password baru", { exact: true }).fill("pendek");
    await page.getByLabel("Ulangi password baru").fill("lain");
    await page.getByRole("button", { name: "Simpan password" }).click();
    await expect(page.getByText("Password minimal 10 karakter.")).toBeVisible();
    await expect(page.getByText("Konfirmasi password tidak sama.")).toBeVisible();

    // Dibuat saat test berjalan (bukan literal) supaya tidak dianggap rahasia oleh gitleaks.
    const newPassword = `Baru${randomUUID().slice(0, 8)}X9`;
    await page.getByLabel("Password baru", { exact: true }).fill(newPassword);
    await page.getByLabel("Ulangi password baru").fill(newPassword);
    await page.getByRole("button", { name: "Simpan password" }).click();
    await expect(page).toHaveURL("/portal/lapangan");

    // Keluar, lalu password lama ditolak dan password baru diterima.
    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL("/portal/login");
    await loginViaForm(page, user);
    await expect(page.getByRole("alert")).toHaveText("Email atau password salah.");
    await loginViaForm(page, { email: user.email, password: newPassword });
    await expect(page).toHaveURL("/portal/lapangan");
  });

  test("email tidak terdaftar mendapat jawaban yang sama, tanpa email terkirim", async ({
    page,
  }) => {
    const address = "belum-terdaftar@e2e.kisgroup.co.id";
    await page.goto("/portal/lupa-password");
    await page.getByLabel("Email akun portal").fill(address);
    await page.getByRole("button", { name: "Kirim tautan" }).click();
    await expect(page.getByRole("status")).toContainText(SENT_MESSAGE);
    expect(await countEmails(address)).toBe(0);
  });

  test("tautan rusak atau kedaluwarsa kembali ke halaman masuk dengan pesan", async ({ page }) => {
    await page.goto("/portal/auth/confirm?token_hash=tidak-valid&type=recovery");
    await expect(page).toHaveURL("/portal/login?error=tautan");
    await expect(page.getByRole("alert")).toHaveText(
      "Tautan sudah tidak berlaku. Minta tautan baru lewat lupa password.",
    );
  });

  test("halaman password baru butuh sesi", async ({ page }) => {
    await page.goto("/portal/reset-password");
    await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Freset-password/);
  });
});
