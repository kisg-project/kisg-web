import { createPortalUser } from "../factories/users";
import { adminClient } from "../fixtures/supabase";
import { expectNoA11yViolations } from "../fixtures/test";
import { expect, storageStateFor, test } from "../fixtures/portal";

function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

test.describe("Dashboard direktur utama", () => {
  test.use({ storageState: storageStateFor("owner") });

  test("widget jam kerja, persetujuan, tabel kehadiran, dan jadwal", async ({ page }) => {
    const employee = await createPortalUser({ role: "marketing", prefix: "dasbor" });
    await adminClient()
      .from("attendance_records")
      .insert({
        user_id: employee.id,
        work_date: todayWib(),
        clock_in_at: new Date().toISOString(),
        clock_in_lat: -6.25,
        clock_in_lng: 107.05,
        clock_in_photo_path: `${employee.id}/${todayWib()}/masuk-dasbor.webp`,
        late_minutes: 7,
      });
    await adminClient().from("work_reports").insert({
      user_id: employee.id,
      work_date: todayWib(),
      kind: "rencana",
      content: "Survei calon pembeli di lokasi proyek.",
    });

    await page.goto("/portal/owner");
    const clock = page.getByRole("region", { name: "Jam kerja hari ini" });
    await expect(clock.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeVisible();
    await expect(clock.getByText(/^Hadir \d+ dari \d+$/)).toBeVisible();

    await expect(page.getByRole("region", { name: "Persetujuan" })).toBeVisible();

    const table = page.getByRole("region", { name: "Kehadiran karyawan" });
    const search = table.getByRole("searchbox", { name: "Cari karyawan" }).first();
    await search.fill(employee.fullName);
    const row = table
      .getByRole("list", { name: "Tabel kehadiran hari ini" })
      .getByRole("listitem")
      .filter({ hasText: employee.fullName });
    await expect(row).toHaveCount(1);
    await expect(row.getByText("Terlambat")).toBeVisible();
    await expect(row.getByText("50%")).toBeVisible();
    await search.fill("nama yang tidak ada");
    await expect(table.getByText("Karyawan tidak ditemukan")).toBeVisible();

    const schedule = page.getByRole("region", { name: "Jadwal" });
    const agenda = schedule.getByRole("list", { name: "Agenda hari ini" });
    await expect(agenda.getByText("Kehadiran")).toBeVisible();
    await expect(agenda.getByText(/terlambat/)).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
