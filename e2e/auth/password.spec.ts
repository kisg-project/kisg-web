import { randomUUID } from "node:crypto";
import { createPortalUser } from "../factories/users";
import { codeFrom, countEmails, waitForEmail } from "../fixtures/mailpit";
import { expectNoA11yViolations } from "../fixtures/test";
import { expect, loginViaForm, test } from "../fixtures/portal";

const RESET_SUBJECT = "Kode password akun KIS Group";
const SENT_MESSAGE = /Kalau email itu terdaftar, kode 6 digit sudah dikirim/;

test.describe("Lupa password", () => {
  test("atur ulang dengan kode dari email, langsung masuk, lalu password baru berlaku", async ({
    page,
  }) => {
    const user = await createPortalUser({ role: "site_supervisor" });

    await page.goto("/portal/login");
    await page.getByRole("link", { name: "Lupa password" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Lupa password" })).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByLabel("Email akun portal").fill(user.email);
    await page.getByRole("button", { name: "Kirim kode" }).click();
    const step = page.getByRole("form", { name: "Atur password baru" });
    await expect(step.getByRole("status")).toContainText(SENT_MESSAGE);
    await expectNoA11yViolations(page);

    const email = await waitForEmail(user.email, RESET_SUBJECT);
    const code = codeFrom(email);
    // Email berisi kode, bukan tautan (tautan /portal di domain utama tidak dipakai).
    expect(email.html).not.toContain("/portal/auth/confirm");

    // Aturan password dan format kode dicek sebelum dikirim.
    await step.getByLabel("Kode dari email").fill("12");
    await step.getByLabel("Password baru", { exact: true }).fill("pendek");
    await step.getByLabel("Ulangi password baru", { exact: true }).fill("lain");
    await step.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(step.getByText("Masukkan 6 digit kode dari email.")).toBeVisible();
    await expect(step.getByText("Password minimal 10 karakter.")).toBeVisible();
    await expect(step.getByText("Konfirmasi password tidak sama.")).toBeVisible();

    // Dibuat saat test berjalan (bukan literal) supaya tidak dianggap rahasia oleh gitleaks.
    const newPassword = `Baru${randomUUID().slice(0, 8)}X9`;
    const wrong = code === "000000" ? "111111" : "000000";
    await step.getByLabel("Kode dari email").fill(wrong);
    await step.getByLabel("Password baru", { exact: true }).fill(newPassword);
    await step.getByLabel("Ulangi password baru", { exact: true }).fill(newPassword);
    await step.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(step.getByRole("alert")).toHaveText(
      "Kode salah atau sudah tidak berlaku. Periksa email, atau minta kode baru.",
    );

    await step.getByLabel("Kode dari email").fill(code);
    await step.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page).toHaveURL("/portal/lapangan");

    // Keluar, lalu password lama ditolak dan password baru diterima.
    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL("/portal/login");
    await loginViaForm(page, user);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Email atau password salah.",
    );
    await loginViaForm(page, { email: user.email, password: newPassword });
    await expect(page).toHaveURL("/portal/lapangan");
  });

  test("email tidak terdaftar mendapat jawaban yang sama, tanpa email terkirim", async ({
    page,
  }) => {
    const address = "belum-terdaftar@e2e.kisgroup.co.id";
    await page.goto("/portal/lupa-password");
    await page.getByLabel("Email akun portal").fill(address);
    await page.getByRole("button", { name: "Kirim kode" }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText(SENT_MESSAGE);
    expect(await countEmails(address)).toBe(0);
  });

  test("tautan rusak atau kedaluwarsa kembali ke halaman masuk dengan pesan", async ({ page }) => {
    await page.goto("/portal/auth/confirm?token_hash=tidak-valid&type=recovery");
    await expect(page).toHaveURL("/portal/login?error=tautan");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Tautan sudah tidak berlaku. Minta tautan baru lewat lupa password.",
    );
  });

  test("halaman password baru butuh sesi", async ({ page }) => {
    await page.goto("/portal/reset-password");
    await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Freset-password/);
  });
});
