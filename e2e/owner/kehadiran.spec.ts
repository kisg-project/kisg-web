import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { createPortalUser, type TestUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, storageStateFor, test } from "../fixtures/portal";

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** Owner baru per test: rate limit tanda tangan dihitung per akun, jadi test paralel tidak saling ganggu. */
async function loginOwner(page: Page): Promise<TestUser> {
  const owner = await createPortalUser({ role: "owner", prefix: "owner-hadir" });
  await page.goto("/portal/login");
  await loginViaForm(page, owner);
  await expect(page).toHaveURL("/portal/owner");
  // Muat ulang penuh: halaman login yang disimpan tersembunyi oleh router tidak ikut di DOM.
  await page.goto("/portal/owner");
  return owner;
}

/** Karyawan yang mengajukan clock in di luar lokasi hari ini (foto dan data langsung lewat admin). */
async function pendingException(reason: string) {
  const employee = await createPortalUser({ role: "marketing", prefix: "luar-hadir" });
  const photo = `${employee.id}/${todayWib()}/masuk-${randomUUID()}.webp`;
  await adminClient()
    .storage.from("attendance-photos")
    .upload(photo, Buffer.from("RIFF0000WEBPVP8 "), { contentType: "image/webp" });
  const { data, error } = await adminClient()
    .from("attendance_exceptions")
    .insert({
      user_id: employee.id,
      work_date: todayWib(),
      kind: "masuk",
      lat: -6.25,
      lng: 107.05,
      accuracy_m: 15,
      nearest_distance_m: 1250,
      reason,
      photo_path: photo,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Gagal membuat pengajuan: ${error.message}`);
  return { employee, exceptionId: data.id };
}

test.describe("Kehadiran owner", () => {
  test("dashboard menampilkan grafik dengan tabel data", async ({ page }) => {
    const employee = await createPortalUser({ role: "site_supervisor", prefix: "grafik" });
    await adminClient()
      .from("attendance_records")
      .insert({
        user_id: employee.id,
        work_date: todayWib(),
        clock_in_at: new Date().toISOString(),
        clock_in_lat: -6.25,
        clock_in_lng: 107.05,
        clock_in_photo_path: `${employee.id}/${todayWib()}/masuk-grafik.webp`,
        late_minutes: 12,
      });
    await adminClient().from("work_reports").insert({
      user_id: employee.id,
      work_date: todayWib(),
      kind: "rencana",
      content: "Cek progres pengecoran blok A dan pengiriman material.",
    });
    await loginOwner(page);

    const summary = page.getByRole("region", { name: "Ringkasan kehadiran" });
    await expect(
      summary.getByRole("heading", { name: "Kehadiran 14 hari terakhir" }),
    ).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);

    const attendance = summary.getByRole("region", { name: "Kehadiran 14 hari terakhir" });
    await expect(attendance.getByRole("list", { name: "Keterangan warna" })).toContainText(
      "Tepat waktu",
    );
    await attendance.getByRole("button", { name: "Lihat tabel" }).click();
    await expect(attendance.getByRole("table").getByRole("row")).toHaveCount(15);
    await expect(attendance.getByRole("button", { name: "Lihat grafik" })).toBeVisible();

    await page.getByRole("link", { name: "Buka rekap kehadiran" }).click();
    await expect(page).toHaveURL("/portal/owner/absensi");
    await expect(page.getByRole("heading", { level: 1, name: "Kehadiran" })).toBeVisible();
    const card = page
      .getByRole("list", { name: "Kehadiran karyawan" })
      .getByRole("listitem")
      .filter({
        hasText: employee.fullName,
      });
    await expect(card.getByText("Terlambat 12 menit")).toBeVisible();
    await card.getByText("Rencana kegiatan").click();
    await expect(card.getByText("Cek progres pengecoran blok A")).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });

  test("setujui pengajuan di luar lokasi dengan tanda tangan password, lalu verifikasi QR", async ({
    page,
  }) => {
    const reason = `Survei lahan bersama calon pembeli ${randomUUID().slice(0, 6)}.`;
    const { employee, exceptionId } = await pendingException(reason);
    const owner = await loginOwner(page);
    await page.goto("/portal/owner/absensi");

    const pending = page
      .getByRole("list", { name: "Pengajuan menunggu" })
      .getByRole("listitem")
      .filter({
        hasText: reason,
      });
    await pending.getByRole("button", { name: "Setujui" }).click();
    const dialog = page.getByRole("dialog", { name: "Setujui pengajuan" });
    await expect(dialog.getByText(employee.fullName)).toBeVisible();
    await expectNoA11yViolations(page);

    // Password salah: ditolak, tidak ada yang berubah.
    await dialog.getByLabel("Password akun Anda", { exact: true }).fill("PasswordSalah2026");
    await dialog.getByRole("button", { name: "Setujui" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Password salah. Persetujuan belum disimpan.",
    );

    await dialog.getByLabel("Password akun Anda", { exact: true }).fill(owner.password);
    await dialog.getByRole("button", { name: "Setujui" }).click();
    await expect(page.getByText("Pengajuan disetujui.")).toBeVisible();
    await expect(dialog).toBeHidden();

    const { data: decided } = await adminClient()
      .from("attendance_exceptions")
      .select("status, decided_by")
      .eq("id", exceptionId)
      .single();
    expect(decided).toEqual({ status: "disetujui", decided_by: owner.id });
    const { data: record } = await adminClient()
      .from("attendance_records")
      .select("clock_in_exception_id")
      .eq("user_id", employee.id)
      .single();
    expect(record?.clock_in_exception_id).toBe(exceptionId);
    const { data: stamp } = await adminClient()
      .from("approval_stamps")
      .select("signer_id, signer_role, decision, verify_code, content_hash")
      .eq("doc_id", exceptionId)
      .single();
    expect(stamp).toMatchObject({
      signer_id: owner.id,
      signer_role: "owner",
      decision: "disetujui",
    });
    expect(stamp?.verify_code).toMatch(/^[0-9a-f]{64}$/);

    const decidedList = page.getByRole("list", { name: "Pengajuan diputuskan" });
    await expect(decidedList.getByText(employee.fullName, { exact: false })).toBeVisible();

    await page.goto(`/verifikasi/${stamp?.verify_code ?? ""}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Verifikasi persetujuan digital" }),
    ).toBeVisible();
    await expect(
      page.getByText("Cap persetujuan asli. Isi dokumen sama dengan saat diputuskan."),
    ).toBeVisible();
    await expect(page.getByText(owner.fullName, { exact: false })).toBeVisible();
    await expectNoA11yViolations(page);

    // Isi dokumen diubah setelah disetujui: verifikasi menyatakan tidak cocok.
    await adminClient()
      .from("attendance_exceptions")
      .update({ reason: `${reason} Diubah.` })
      .eq("id", exceptionId);
    await page.reload();
    await expect(
      page.getByText("Tidak cocok. Isi dokumen berubah setelah diputuskan."),
    ).toBeVisible();
  });

  test("tolak pengajuan wajib alasan, absen tidak tercatat", async ({ page }) => {
    const reason = `Bertemu notaris di Cikarang ${randomUUID().slice(0, 6)}.`;
    const { employee, exceptionId } = await pendingException(reason);
    const owner = await loginOwner(page);
    await page.goto("/portal/owner/absensi");

    const pending = page
      .getByRole("list", { name: "Pengajuan menunggu" })
      .getByRole("listitem")
      .filter({
        hasText: reason,
      });
    await pending.getByRole("button", { name: "Tolak" }).click();
    const dialog = page.getByRole("dialog", { name: "Tolak pengajuan" });
    await dialog.getByLabel("Password akun Anda", { exact: true }).fill(owner.password);
    await dialog.getByRole("button", { name: "Tolak" }).click();
    await expect(dialog.getByText("Tulis alasan penolakan minimal 5 karakter.")).toBeVisible();

    await dialog.getByLabel("Alasan penolakan").fill("Tidak ada jadwal survei hari ini.");
    await dialog.getByRole("button", { name: "Tolak" }).click();
    await expect(page.getByText("Pengajuan ditolak.")).toBeVisible();

    const { data } = await adminClient()
      .from("attendance_exceptions")
      .select("status, decision_note")
      .eq("id", exceptionId)
      .single();
    expect(data).toEqual({ status: "ditolak", decision_note: "Tidak ada jadwal survei hari ini." });
    const { data: records } = await adminClient()
      .from("attendance_records")
      .select("id")
      .eq("user_id", employee.id);
    expect(records).toEqual([]);
  });

  test("kode verifikasi tidak dikenal: halaman tidak ditemukan", async ({ page }) => {
    // Halaman di-stream, jadi status HTTP tetap 200. Yang dicek isi halamannya.
    await page.goto(`/verifikasi/${"0".repeat(64)}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
    ).toBeAttached();
    await expect(page.getByText("Cap persetujuan asli")).toHaveCount(0);
  });
});

test.describe("Kehadiran owner: akses", () => {
  test.use({ storageState: storageStateFor("marketing") });

  test("karyawan biasa tidak bisa membuka rekap kehadiran", async ({ page }) => {
    await page.goto("/portal/owner/absensi");
    await expect(page).toHaveURL("/portal/akses-ditolak");
  });
});
