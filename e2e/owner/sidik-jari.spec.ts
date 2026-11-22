import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { createPortalUser, type TestUser } from "../factories/users";
import { linkFrom, waitForEmail } from "../fixtures/mailpit";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations } from "../fixtures/test";
import { expect, loginViaForm, test } from "../fixtures/portal";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Virtual authenticator WebAuthn hanya di Chromium (CDP)",
);

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function localhostUrl(path: string): string {
  const base = test.info().project.use.baseURL ?? "http://127.0.0.1:3000";
  const url = new URL(path, base);
  url.hostname = "localhost";
  return url.toString();
}

async function addFingerprintDevice(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

async function loginOwnerOnLocalhost(page: Page): Promise<TestUser> {
  const owner = await createPortalUser({ role: "owner", prefix: "owner-jari" });
  await page.goto(localhostUrl("/portal/login"));
  await loginViaForm(page, owner);
  await expect(page).toHaveURL(/\/portal\/owner$/);
  return owner;
}

async function registerFingerprint(page: Page) {
  await page.goto(localhostUrl("/portal/akun"));
  await page.getByRole("button", { name: "Daftarkan sidik jari" }).click();
  const dialog = page.getByRole("dialog", { name: "Daftarkan sidik jari?" });
  await dialog.getByRole("button", { name: "Daftarkan" }).click();
  await expect(page.getByText("Sidik jari terdaftar.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Daftarkan sidik jari" })).toHaveCount(0);
}

async function pendingException(reason: string) {
  const employee = await createPortalUser({ role: "marketing", prefix: "jari-luar" });
  const { data, error } = await adminClient()
    .from("attendance_exceptions")
    .insert({
      user_id: employee.id,
      work_date: todayWib(),
      kind: "masuk",
      lat: -6.25,
      lng: 107.05,
      nearest_distance_m: 900,
      reason,
      photo_path: `${employee.id}/${todayWib()}/masuk-${randomUUID()}.webp`,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Gagal membuat pengajuan: ${error.message}`);
  return data.id;
}

test.describe("Tanda tangan sidik jari", () => {
  test("daftar sekali di Akun saya, lalu setujui pengajuan dengan sidik jari", async ({ page }) => {
    await addFingerprintDevice(page);
    const owner = await loginOwnerOnLocalhost(page);
    await registerFingerprint(page);
    await expectNoA11yViolations(page);

    const { data: credential } = await adminClient()
      .from("webauthn_credentials")
      .select("credential_id, revoked_at")
      .eq("user_id", owner.id)
      .single();
    expect(credential?.revoked_at).toBeNull();

    const reason = `Survei bersama konsumen ${randomUUID().slice(0, 6)}.`;
    const exceptionId = await pendingException(reason);
    await page.goto(localhostUrl("/portal/owner/absensi"));
    const card = page
      .getByRole("list", { name: "Pengajuan menunggu" })
      .getByRole("listitem")
      .filter({ hasText: reason });
    await card.getByRole("button", { name: "Setujui" }).click();
    const dialog = page.getByRole("dialog", { name: "Setujui pengajuan" });
    await expect(dialog.getByText("Konfirmasi dengan sidik jari.")).toBeVisible();
    await dialog.getByRole("button", { name: "Setujui" }).click();
    await expect(page.getByText("Pengajuan disetujui.")).toBeVisible();

    const { data: stamp } = await adminClient()
      .from("approval_stamps")
      .select("method, credential_id, verify_code")
      .eq("doc_id", exceptionId)
      .single();
    expect(stamp).toMatchObject({ method: "biometrik", credential_id: credential?.credential_id });

    await page.goto(localhostUrl(`/verifikasi/${stamp?.verify_code ?? ""}`));
    await expect(page.getByText("Sidik jari perangkat terdaftar")).toBeVisible();
  });

  test("cadangan password tetap bisa dan tercatat sebagai metode cadangan", async ({ page }) => {
    await addFingerprintDevice(page);
    const owner = await loginOwnerOnLocalhost(page);
    await registerFingerprint(page);

    const reason = `Rapat dengan bank ${randomUUID().slice(0, 6)}.`;
    const exceptionId = await pendingException(reason);
    await page.goto(localhostUrl("/portal/owner/absensi"));
    await page
      .getByRole("list", { name: "Pengajuan menunggu" })
      .getByRole("listitem")
      .filter({ hasText: reason })
      .getByRole("button", { name: "Setujui" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Setujui pengajuan" });
    await dialog.getByRole("button", { name: "Pakai password" }).click();
    await dialog.getByLabel("Password akun Anda", { exact: true }).fill(owner.password);
    await dialog.getByRole("button", { name: "Setujui" }).click();
    await expect(page.getByText("Pengajuan disetujui.")).toBeVisible();

    const { data: stamp } = await adminClient()
      .from("approval_stamps")
      .select("method, credential_id")
      .eq("doc_id", exceptionId)
      .single();
    expect(stamp).toEqual({ method: "cadangan", credential_id: null });
  });

  test("Direktur Utama mereset sidik jari karyawan", async ({ page }) => {
    const employee = await createPortalUser({ role: "finance", prefix: "reset-jari" });
    await adminClient()
      .from("webauthn_credentials")
      .insert({ user_id: employee.id, credential_id: `uji-${randomUUID()}`, public_key: "eA" });
    await loginOwnerOnLocalhost(page);
    await page.goto(localhostUrl("/portal/owner/karyawan"));
    await page.getByRole("searchbox", { name: "Cari karyawan" }).fill(employee.email);
    const card = page.getByRole("listitem", { name: employee.fullName });
    await card.getByRole("button", { name: "Reset sidik jari" }).click();
    await page
      .getByRole("dialog", { name: `Reset sidik jari ${employee.fullName}?` })
      .getByRole("button", { name: "Ya, reset" })
      .click();
    await expect(page.getByText("Sidik jari direset.")).toBeVisible();
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .from("webauthn_credentials")
          .select("revoked_at")
          .eq("user_id", employee.id)
          .single();
        return data?.revoked_at ?? null;
      })
      .not.toBeNull();
    await expect(card.getByRole("button", { name: "Reset sidik jari" })).toHaveCount(0);
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .from("notifications")
          .select("kind, href")
          .eq("user_id", employee.id);
        return data;
      })
      .toEqual([{ kind: "sidik_jari_direset", href: "/portal/akun#akun-sidik-jari" }]);
    const email = await waitForEmail(employee.email, "Sidik jari Anda direset");
    expect(email.text).toContain("Daftarkan ulang di Akun saya");
    expect(linkFrom(email, "/portal/akun")).toContain("#akun-sidik-jari");
  });

  test("tanpa sidik jari terdaftar, persetujuan diarahkan ke pendaftaran", async ({ page }) => {
    await loginOwnerOnLocalhost(page);
    const reason = `Survei tanpa sidik jari ${randomUUID().slice(0, 6)}.`;
    await pendingException(reason);
    await page.goto(localhostUrl("/portal/owner/absensi"));
    await page
      .getByRole("list", { name: "Pengajuan menunggu" })
      .getByRole("listitem")
      .filter({ hasText: reason })
      .getByRole("button", { name: "Setujui" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Daftarkan sidik jari dulu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Password akun Anda", { exact: true })).toHaveCount(0);
    await expectNoA11yViolations(page);
    await dialog.getByRole("link", { name: "Daftar sekarang" }).click();
    await expect(page).toHaveURL(/\/portal\/akun/);
    await expect(page.getByRole("button", { name: "Daftarkan sidik jari" })).toBeVisible();
  });
});
