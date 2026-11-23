import { randomInt, randomUUID } from "node:crypto";
import type { BrowserContext, Page } from "@playwright/test";
import { createPortalUser, type TestUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations, expectResponsive } from "../fixtures/test";
import { expect, loginViaForm, storageStateFor, test } from "../fixtures/portal";

interface Point {
  latitude: number;
  longitude: number;
}

/**
 * Koordinat acak per test (wilayah Indonesia), supaya titik absensi test yang jalan paralel tidak
 * saling berdekatan. Peluang dua titik acak berjarak di bawah 2 km sangat kecil.
 */
function randomPoint(): Point {
  // Dibulatkan 6 desimal, sama dengan presisi kolom numeric(9, 6) dan isian form.
  const round = (value: number) => Number(value.toFixed(6));
  return {
    latitude: round(-8 + randomInt(0, 7_000_000) / 1_000_000),
    longitude: round(100 + randomInt(0, 20_000_000) / 1_000_000),
  };
}

async function createWorkLocation(point: Point, radiusM = 100) {
  const name = `Uji titik ${randomUUID().slice(0, 8)}`;
  const { data, error } = await adminClient()
    .from("work_locations")
    .insert({ name, kind: "kantor", lat: point.latitude, lng: point.longitude, radius_m: radiusM })
    .select("id, name")
    .single();
  if (error) throw new Error(`Gagal membuat titik absensi: ${error.message}`);
  return data;
}

/**
 * Kamera palsu dari canvas (wajah berupa lingkaran di latar yang berganti warna). Dipakai di semua
 * browser, termasuk WebKit yang tidak punya flag kamera palsu. Build CI memakai
 * NEXT_PUBLIC_E2E_FACE_STUB=1, jadi deteksi wajah dan kedip diganti tombol "Ambil foto (mode uji)".
 */
async function useFakeCamera(page: Page) {
  await page.addInitScript(() => {
    const stream = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 640;
      const context = canvas.getContext("2d");
      let hue = 0;
      const draw = () => {
        if (!context) return;
        hue = (hue + 3) % 360;
        context.fillStyle = `hsl(${String(hue)} 30% 40%)`;
        context.fillRect(0, 0, 640, 640);
        context.fillStyle = "#e8c3a0";
        context.beginPath();
        context.arc(320, 300, 170, 0, Math.PI * 2);
        context.fill();
        requestAnimationFrame(draw);
      };
      draw();
      return canvas.captureStream(15);
    };
    navigator.mediaDevices.getUserMedia = () => Promise.resolve(stream());
  });
}

async function standAt(context: BrowserContext, point: Point) {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ ...point, accuracy: 12 });
}

async function loginEmployee(page: Page, user: TestUser) {
  await page.goto("/portal/login");
  await loginViaForm(page, user);
  await expect(page).not.toHaveURL(/\/portal\/login/);
}

/** Ambil foto lewat kamera palsu. Tombol uji muncul setelah kamera siap. */
async function takeSelfie(page: Page) {
  await page.getByRole("button", { name: "Ambil foto (mode uji)" }).click();
  await expect(page.getByRole("img", { name: "Foto absensi yang diambil" })).toBeVisible();
}

async function attendanceOf(userId: string) {
  const { data } = await adminClient()
    .from("attendance_records")
    .select(
      "work_date, clock_in_location_id, clock_in_distance_m, clock_in_photo_path, clock_out_at, clock_out_location_id, clock_out_photo_path",
    )
    .eq("user_id", userId);
  return data ?? [];
}

async function workReportsOf(userId: string) {
  const { data } = await adminClient()
    .from("work_reports")
    .select("kind, content, attachments")
    .eq("user_id", userId);
  return (data ?? []).map((row) => ({
    ...row,
    attachments: row.attachments as { path: string; name: string; type: string; size: number }[],
  }));
}

test.describe("Absensi karyawan", () => {
  test("clock in dan clock out di dalam radius, foto tersimpan di bucket privat", async ({
    page,
    context,
  }) => {
    const user = await createPortalUser({ role: "marketing", prefix: "absen" });
    const point = randomPoint();
    const location = await createWorkLocation(point);
    await useFakeCamera(page);
    await standAt(context, point);
    await loginEmployee(page, user);

    await page.goto("/portal/absensi");
    await expect(page.getByRole("heading", { level: 1, name: "Absensi" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);

    await page.getByRole("link", { name: "Clock in sekarang" }).click();
    await expect(page).toHaveURL("/portal/absensi/masuk");
    await expect(page.getByText(/Lokasi ditemukan/)).toBeVisible();
    const send = page.getByRole("button", { name: "Kirim clock in" });
    await expect(send).toBeDisabled();
    await page.screenshot({
      path: "test-results/tampilan/absensi-kamera.png",
      fullPage: true,
      animations: "disabled",
    });
    await takeSelfie(page);
    await page.screenshot({
      path: "test-results/tampilan/absensi-foto.png",
      fullPage: true,
      animations: "disabled",
    });
    await expectNoA11yViolations(page);
    await send.click();
    await expect(
      page.getByRole("status").filter({ hasText: /Clock in tercatat pukul/ }),
    ).toBeVisible();
    await expect(
      page.getByText(`${location.name}, 0 m dari titik.`, { exact: false }),
    ).toBeVisible();

    const [record] = await attendanceOf(user.id);
    expect(record?.clock_in_location_id).toBe(location.id);
    expect(record?.clock_in_distance_m).toBe(0);
    expect(record?.clock_in_photo_path).toMatch(
      new RegExp(`^${user.id}/\\d{4}-\\d{2}-\\d{2}/masuk-`),
    );
    const folder = `${user.id}/${record?.work_date ?? ""}`;
    const { data: files } = await adminClient().storage.from("attendance-photos").list(folder);
    const stored = files?.find((file) => record?.clock_in_photo_path.endsWith(file.name));
    expect(stored, "Foto absensi ada di storage").toBeDefined();
    expect(Number(stored?.metadata?.size)).toBeLessThanOrEqual(150 * 1024);

    // Setelah clock in: rencana kegiatan wajib sebelum modul lain bisa dibuka.
    await page.getByRole("link", { name: "Lanjut" }).click();
    await expect(page).toHaveURL("/portal/absensi/rencana");
    await page.goto("/portal/crm");
    await expect(page).toHaveURL("/portal/absensi/rencana");
    const plan = page.getByRole("form", { name: "Rencana kegiatan hari ini" });
    await expect(plan).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);

    await plan.getByRole("button", { name: "Simpan rencana" }).click();
    await expect(plan.getByText("Tulis minimal 10 karakter.")).toBeVisible();

    // Format lain ditolak di HP sebelum diunggah. Foto kamera besar dikompres lalu diunggah.
    await plan.getByLabel("Tambah file").setInputFiles({
      name: "catatan.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("catatan"),
    });
    await expect(plan.getByText(/Format file tidak didukung/)).toBeVisible();
    await plan.getByRole("button", { name: "Hapus lampiran catatan.txt" }).click();
    await plan.getByLabel("Tambah foto").setInputFiles("e2e/fixtures/files/exif-gps-rotated.jpg");
    const attachments = plan.getByRole("list", { name: "Lampiran" });
    await expect(attachments.getByRole("listitem")).toHaveCount(1);
    await expect(attachments.getByText(/\d+ KB$/)).toBeVisible();

    await plan
      .getByLabel("Rencana kegiatan")
      .fill("Follow up 5 calon pembeli dan survei unit blok A bersama konsumen.");
    await plan.getByRole("button", { name: "Simpan rencana" }).click();
    await expect(page).toHaveURL("/portal/crm");

    const reports = await workReportsOf(user.id);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.kind).toBe("rencana");
    const [photo] = reports[0]?.attachments ?? [];
    expect(photo?.path).toMatch(
      new RegExp(`^${user.id}/\\d{4}-\\d{2}-\\d{2}/[\\w-]+\\.(webp|jpg)$`),
    );
    const { data: photoFile } = await adminClient()
      .storage.from("work-attachments")
      .download(photo?.path ?? "");
    expect(photoFile?.size ?? Infinity, "Foto lampiran dikompres").toBeLessThanOrEqual(300 * 1024);

    // Clock in kedua di hari yang sama tidak bisa: halaman masuk kembali ke absensi.
    await page.goto("/portal/absensi/masuk");
    await expect(page).toHaveURL("/portal/absensi");
    await expect(page.getByRole("link", { name: "Ubah rencana kegiatan" })).toBeVisible();

    await page.getByRole("link", { name: "Clock out sekarang" }).click();
    await expect(page).toHaveURL("/portal/absensi/pulang");
    await expect(page.getByText(/Lokasi ditemukan/)).toBeVisible();
    await takeSelfie(page);
    await page.getByRole("button", { name: "Kirim clock out" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: /Clock out tercatat pukul/ }),
    ).toBeVisible();
    const [done] = await attendanceOf(user.id);
    expect(done?.clock_out_at).not.toBeNull();
    expect(done?.clock_out_location_id).toBe(location.id);
    expect(done?.clock_out_photo_path).toMatch(/\/pulang-/);

    // Setelah clock out: hasil kerja wajib, dengan lampiran PDF.
    await page.getByRole("link", { name: "Lanjut" }).click();
    await expect(page).toHaveURL("/portal/absensi/hasil");
    await page.goto("/portal/crm");
    await expect(page).toHaveURL("/portal/absensi/hasil");
    const result = page.getByRole("form", { name: "Hasil kerja hari ini" });
    await result.getByLabel("Tambah file").setInputFiles({
      name: "laporan-survei.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n"),
    });
    await expect(result.getByText("laporan-survei.pdf")).toBeVisible();
    await expect(result.getByRole("button", { name: "Kirim hasil kerja" })).toBeEnabled();
    await result
      .getByLabel("Hasil kerja")
      .fill("3 calon pembeli dihubungi, 1 jadwal survei hari Sabtu. Kendala: hujan.");
    await result.getByRole("button", { name: "Kirim hasil kerja" }).click();
    await expect(page).toHaveURL("/portal/absensi");
    await expect(page.getByText("Absensi dan laporan hari ini lengkap.")).toBeVisible();

    const final = await workReportsOf(user.id);
    const hasil = final.find((row) => row.kind === "hasil");
    expect(hasil?.content).toContain("3 calon pembeli");
    expect(hasil?.attachments).toEqual([
      expect.objectContaining({ name: "laporan-survei.pdf", type: "application/pdf" }),
    ]);
    await page.goto("/portal/crm");
    await expect(page).toHaveURL("/portal/crm");
  });

  test("di luar radius ditolak, lalu mengajukan absen di luar lokasi", async ({
    page,
    context,
  }) => {
    const user = await createPortalUser({ role: "site_supervisor", prefix: "luar" });
    const point = randomPoint();
    const location = await createWorkLocation(point);
    await useFakeCamera(page);
    // Sekitar 1,1 km di utara titik absensi.
    await standAt(context, {
      latitude: Number((point.latitude + 0.01).toFixed(6)),
      longitude: point.longitude,
    });
    await loginEmployee(page, user);

    await page.goto("/portal/absensi/masuk");
    await expect(page.getByText(/Lokasi ditemukan/)).toBeVisible();
    await takeSelfie(page);
    await page.getByRole("button", { name: "Kirim clock in" }).click();
    const outside = page.getByRole("region", { name: "Anda di luar radius absensi" });
    await expect(outside).toBeVisible();
    await expect(
      outside.getByText(new RegExp(`Titik terdekat ${location.name} berjarak \\d+ m`)),
    ).toBeVisible();
    expect(await attendanceOf(user.id), "Absen di luar radius tidak tercatat").toEqual([]);

    // Alasan terlalu pendek ditolak.
    await outside.getByLabel("Alasan").fill("Survei");
    await outside.getByRole("button", { name: "Ajukan absen di luar lokasi" }).click();
    await expect(outside.getByText(/minimal 10 karakter/)).toBeVisible();

    await outside.getByLabel("Alasan").fill("Survei lahan bersama calon pembeli di lokasi lain.");
    await outside.getByRole("button", { name: "Ajukan absen di luar lokasi" }).click();
    await expect(page.getByText("Pengajuan terkirim")).toBeVisible();

    const { data: requests } = await adminClient()
      .from("attendance_exceptions")
      .select("kind, status, nearest_location_id, nearest_distance_m, reason")
      .eq("user_id", user.id);
    expect(requests).toHaveLength(1);
    expect(requests?.[0]).toMatchObject({
      kind: "masuk",
      status: "menunggu",
      nearest_location_id: location.id,
    });
    expect(requests?.[0]?.nearest_distance_m).toBeGreaterThan(1000);
    const { data: request } = await adminClient()
      .from("attendance_exceptions")
      .select("id")
      .eq("user_id", user.id)
      .single();
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .from("notifications")
          .select("user_id, kind, href")
          .eq("dedupe_key", `absen-luar:${request?.id ?? ""}:diajukan`);
        return data ?? [];
      })
      .toContainEqual(
        expect.objectContaining({
          kind: "absen_luar_lokasi_diajukan",
          href: "/portal/owner/absensi",
        }),
      );
    const { data: notified } = await adminClient()
      .from("notifications")
      .select("user_id")
      .eq("dedupe_key", `absen-luar:${request?.id ?? ""}:diajukan`);
    expect(notified?.map((row) => row.user_id)).not.toContain(user.id);

    await page.getByRole("status").getByRole("link", { name: "Kembali ke absensi" }).click();
    const pendingSection = page.getByRole("region", { name: "Pengajuan di luar lokasi" });
    await expect(pendingSection).toBeVisible();
    await expect(pendingSection.getByText("Menunggu persetujuan", { exact: true })).toBeVisible();
  });

  test("izin lokasi ditolak: tombol kirim tetap mati dan ada petunjuk", async ({
    page,
    context,
  }) => {
    const user = await createPortalUser({ role: "finance", prefix: "gps" });
    await useFakeCamera(page);
    await context.clearPermissions();
    await loginEmployee(page, user);
    await page.goto("/portal/absensi/masuk");
    await expect(page.getByText(/Izinkan akses lokasi di browser/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Kirim clock in" })).toBeDisabled();
  });
});

test.describe("Absensi: akses", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("owner tidak wajib absensi", async ({ page }) => {
    await page.goto("/portal/absensi");
    await expect(page).toHaveURL("/portal/absensi");
    await expect(
      page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
    ).toBeVisible();
  });
});

test.describe("Titik absensi dan jam kerja (owner)", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("tambah titik absensi dengan lokasi saya sekarang", async ({ page, context }) => {
    const point = randomPoint();
    await standAt(context, point);
    await page.goto("/portal/owner");
    await page.getByRole("link", { name: /Titik absensi/ }).click();
    await expect(page).toHaveURL("/portal/owner/titik-absensi");
    await expect(page.getByRole("heading", { level: 1, name: "Titik absensi" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);

    // Tambah lewat dialog: tanpa tombol X, Batal dan Simpan, klik di luar tidak menutup.
    await page.getByRole("button", { name: "Tambah titik absensi" }).click();
    const dialog = page.getByRole("dialog", { name: "Tambah titik absensi" });
    await expect(dialog).toBeVisible();
    await expectNoA11yViolations(page);
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Tambah titik absensi" }).click();
    const form = dialog.getByRole("form", { name: "Tambah titik absensi" });
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(form.getByText("Nama titik minimal 3 karakter.")).toBeVisible();

    const name = `Kantor uji ${randomUUID().slice(0, 8)}`;
    await form.getByLabel("Nama titik").fill(name);
    await form.getByRole("button", { name: "Pakai lokasi saya sekarang" }).click();
    await expect(form.getByLabel("Lintang")).toHaveValue(String(point.latitude));
    await expect(form.getByLabel("Bujur")).toHaveValue(String(point.longitude));
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Titik absensi ditambahkan.")).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("list", { name: "Daftar titik absensi" }).getByText(name),
    ).toBeVisible();

    const { data } = await adminClient()
      .from("work_locations")
      .select("kind, lat, lng, radius_m, is_active")
      .eq("name", name)
      .single();
    expect(data).toMatchObject({
      kind: "kantor",
      lat: point.latitude,
      lng: point.longitude,
      radius_m: 100,
      is_active: true,
    });
  });

  test("jam kerja khusus per titik: simpan lalu hapus", async ({ page }) => {
    const location = await createWorkLocation(randomPoint());
    await page.goto("/portal/owner/jam-kerja");
    await expect(page.getByRole("heading", { level: 1, name: "Jam kerja" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);

    // Jalur gagal di form perusahaan: jam pulang sebelum jam masuk. Tidak disimpan.
    const company = page.getByRole("form", { name: "Jam kerja perusahaan" });
    await company.getByLabel("Jam pulang").fill("07:00");
    await company.getByRole("button", { name: "Simpan jam kerja" }).click();
    await expect(company.getByText("Jam pulang harus setelah jam masuk.")).toBeVisible();

    await page.getByRole("button", { name: "Tambah jam khusus" }).click();
    const form = page
      .getByRole("dialog", { name: "Tambah jam khusus" })
      .getByRole("form", { name: "Jam kerja khusus" });
    await form.getByRole("combobox", { name: "Titik absensi" }).click();
    await page.getByRole("option", { name: location.name }).click();
    await form.getByLabel("Jam masuk").fill("07:30");
    await form.getByLabel("Jam pulang").fill("16:30");
    await form.getByLabel("Minggu").check();
    await form.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Jam kerja tersimpan.")).toBeVisible();

    const item = page
      .getByRole("list", { name: "Daftar jam khusus" })
      .getByRole("listitem")
      .filter({
        hasText: location.name,
      });
    await expect(item).toContainText("07:30 sampai 16:30");
    const { data } = await adminClient()
      .from("work_schedules")
      .select("start_time, end_time, workdays, late_tolerance_min")
      .eq("work_location_id", location.id)
      .single();
    expect(data).toMatchObject({
      start_time: "07:30:00",
      end_time: "16:30:00",
      workdays: [1, 2, 3, 4, 5, 6, 7],
      late_tolerance_min: 15,
    });

    await item.getByRole("button", { name: `Hapus jam kerja ${location.name}` }).click();
    await page
      .getByRole("dialog", { name: `Hapus jam kerja ${location.name}?` })
      .getByRole("button", { name: "Ya, hapus" })
      .click();
    await expect(page.getByText("Jam kerja khusus dihapus.")).toBeVisible();
    const { data: gone } = await adminClient()
      .from("work_schedules")
      .select("id")
      .eq("work_location_id", location.id);
    expect(gone).toEqual([]);
  });

  test("karyawan biasa tidak bisa membuka pengaturan absensi", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStateFor("marketing") });
    const page = await context.newPage();
    for (const path of ["/portal/owner/titik-absensi", "/portal/owner/jam-kerja"]) {
      await page.goto(path);
      await expect(page).toHaveURL(path);
      await expect(
        page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
      ).toBeVisible();
    }
    await context.close();
  });
});
