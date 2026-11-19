import { APP_ROLES, ROLE_LABELS } from "../../src/config/roles";
import { PORTAL_AREAS, ROLE_HOME } from "../../src/config/portal";
import { createPortalUser, setUserActive } from "../factories/users";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, test } from "../fixtures/portal";

function areaLabel(href: string): string {
  const area = PORTAL_AREAS.find((item) => item.prefix === href);
  if (!area) throw new Error(`Area ${href} tidak ada`);
  return area.label;
}

test.describe("Login portal", () => {
  test("halaman masuk tidak diindeks, aksesibel, dan responsif", async ({ page }) => {
    await page.goto("/portal/login");
    await expect(page.getByRole("heading", { level: 1, name: "Masuk ke portal" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  for (const role of APP_ROLES) {
    test(`login ${role} masuk ke beranda role-nya`, async ({ page }) => {
      const user = await createPortalUser({ role });
      await page.goto("/portal/login");
      await loginViaForm(page, user);
      await expect(page).toHaveURL(ROLE_HOME[role]);
      await expect(
        page.getByRole("heading", { level: 1, name: areaLabel(ROLE_HOME[role]) }),
      ).toBeVisible();
      await expect(page.getByText(`Masuk sebagai ${user.fullName}.`)).toBeVisible();
      // Cookie sesi Supabase terbentuk.
      const cookies = await page.context().cookies();
      expect(cookies.some((cookie) => cookie.name.includes("auth-token"))).toBe(true);
    });
  }

  test("validasi di browser sebelum dikirim", async ({ page }) => {
    await page.goto("/portal/login");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByText("Isi email.")).toBeVisible();
    await expect(page.getByText("Isi password.")).toBeVisible();
    await page.getByLabel("Email").fill("nama@");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByText(/Format email tidak valid/)).toBeVisible();
    await expect(page).toHaveURL(/\/portal\/login/);
  });

  test("password salah memberi pesan umum", async ({ page }) => {
    const user = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/login");
    await loginViaForm(page, { email: user.email, password: "PasswordSalah123" });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Email atau password salah.",
    );
    await expect(page).toHaveURL(/\/portal\/login/);
  });

  test("email yang tidak terdaftar memberi pesan yang sama", async ({ page }) => {
    await page.goto("/portal/login");
    await loginViaForm(page, { email: "tidak-ada@e2e.kisgroup.co.id", password: "Apapun12345" });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Email atau password salah.",
    );
  });

  test("akun nonaktif tidak bisa masuk", async ({ page }) => {
    const user = await createPortalUser({ role: "marketing", active: false });
    await page.goto("/portal/login");
    await loginViaForm(page, user);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Akun Anda tidak aktif. Hubungi admin.",
    );
    await page.goto("/portal/crm");
    await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fcrm/);
  });

  test("akun tanpa role tidak bisa masuk", async ({ page }) => {
    const user = await createPortalUser({ role: null });
    await page.goto("/portal/login");
    await loginViaForm(page, user);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Akun Anda tidak aktif. Hubungi admin.",
    );
  });

  test("dikunci sementara setelah 5 kali gagal, walau password berikutnya benar", async ({
    page,
  }) => {
    const user = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/login");
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await loginViaForm(page, { email: user.email, password: `Salah${String(attempt)}23456` });
      await expect(page.getByRole("main").getByRole("alert")).toHaveText(
        "Email atau password salah.",
      );
    }
    await loginViaForm(page, user);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.",
    );
    await expect(page).toHaveURL(/\/portal\/login/);
  });

  test("kembali ke halaman tujuan setelah login", async ({ page }) => {
    const user = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/absensi");
    await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fabsensi/);
    await loginViaForm(page, user);
    await expect(page).toHaveURL("/portal/absensi");
  });

  test("parameter next ke situs lain diabaikan", async ({ page }) => {
    const user = await createPortalUser({ role: "site_manager" });
    await page.goto("/portal/login?next=//contoh-jahat.com");
    await loginViaForm(page, user);
    await expect(page).toHaveURL("/portal/lapangan");
  });

  test("akun yang dinonaktifkan saat sesi aktif langsung dikeluarkan", async ({ page }) => {
    const user = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/login");
    await loginViaForm(page, user);
    await expect(page).toHaveURL("/portal/crm");

    await setUserActive(user.id, false);
    await page.goto("/portal/crm");
    await expect(page).toHaveURL("/portal/login?error=nonaktif");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      "Akun Anda sudah tidak aktif. Hubungi admin.",
    );
    // Sesi sudah dihapus: halaman portal kembali meminta login.
    await page.goto("/portal/crm");
    await expect(page).toHaveURL(/\/portal\/login\?next=/);
  });

  test("logout menghapus sesi dan tombol back tidak membuka portal", async ({ page }) => {
    const user = await createPortalUser({ role: "marketing" });
    await page.goto("/portal/login");
    await loginViaForm(page, user);
    await expect(page).toHaveURL("/portal/crm");
    await expect(
      page.getByRole("banner").getByText(ROLE_LABELS.marketing, { exact: true }),
    ).toBeVisible({
      visible: (page.viewportSize()?.width ?? 0) >= 640,
    });
    await page.goto("/portal/absensi");
    await expect(page.getByRole("heading", { level: 1, name: "Absensi" })).toBeVisible();

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL("/portal/login");
    await page.goBack();
    await expect(page).toHaveURL(/\/portal\/login\?next=%2Fportal%2Fcrm/);
    await expect(page.getByRole("heading", { level: 1, name: "Masuk ke portal" })).toBeVisible();
  });
});
