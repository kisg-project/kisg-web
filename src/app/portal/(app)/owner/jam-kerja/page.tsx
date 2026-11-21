import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { WEEKDAYS } from "@/config/attendance";
import { requirePortalUser } from "@/features/auth";
import {
  DeleteScheduleButton,
  ScheduleForm,
  listEmployeeOptions,
  listWorkLocations,
  listWorkSchedules,
} from "@/features/attendance";

export const metadata: Metadata = { title: "Jam kerja" };

function dayNames(days: readonly number[]): string {
  return WEEKDAYS.filter((day) => days.includes(day.value))
    .map((day) => day.label)
    .join(", ");
}

/**
 * Owner mengatur jam masuk dan pulang. Urutan berlaku: jam karyawan, lalu jam titik absensi,
 * lalu jam perusahaan (sama dengan `private.effective_schedule`).
 */
export default async function SchedulesPage() {
  await requirePortalUser(["owner", "admin"]);
  const [schedules, locations, employees] = await Promise.all([
    listWorkSchedules(),
    listWorkLocations(),
    listEmployeeOptions(),
  ]);
  const company = schedules.find((item) => item.scope === "perusahaan");
  const overrides = schedules.filter((item) => item.scope !== "perusahaan");
  const locationChoices = locations.map((item) => ({ id: item.id, name: item.name }));

  return (
    <div className="grid gap-8">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke beranda"
        title="Jam kerja"
        description="Clock in lewat dari jam masuk ditambah toleransi dicatat terlambat. Clock out sebelum jam pulang dicatat pulang awal."
      />
      <section aria-labelledby="jam-perusahaan-judul" className="app-card p-5 sm:p-6">
        <h2 id="jam-perusahaan-judul" className="mb-1 text-lg font-bold">
          Jam kerja perusahaan
        </h2>
        <p className="mb-4 text-sm text-subtle-foreground">
          Berlaku untuk semua karyawan tanpa jam khusus.
        </p>
        <ScheduleForm
          fixedScope
          locations={locationChoices}
          employees={employees}
          initial={{
            scope: "perusahaan",
            targetId: null,
            startTime: company?.startTime ?? "08:00",
            endTime: company?.endTime ?? "17:00",
            workdays: company?.workdays ?? [1, 2, 3, 4, 5, 6],
            lateToleranceMin: company?.lateToleranceMin ?? 15,
          }}
        />
      </section>
      <section aria-labelledby="jam-khusus-judul" className="app-card p-5 sm:p-6">
        <h2 id="jam-khusus-judul" className="mb-1 text-lg font-bold">
          Tambah jam khusus
        </h2>
        <p className="mb-4 text-sm text-subtle-foreground">
          Jam karyawan mengalahkan jam titik absensi. Jam titik mengalahkan jam perusahaan.
        </p>
        <ScheduleForm locations={locationChoices} employees={employees} />
      </section>
      <section aria-labelledby="daftar-jam-khusus" className="grid gap-3">
        <h2 id="daftar-jam-khusus" className="text-lg font-bold">
          Jam khusus
        </h2>
        {overrides.length === 0 ? (
          <EmptyState
            title="Belum ada jam khusus."
            description="Semua karyawan memakai jam kerja perusahaan."
          />
        ) : (
          <ul aria-label="Daftar jam khusus" className="grid gap-2">
            {overrides.map((item) => {
              const name = item.targetName ?? "Tanpa nama";
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 app-card p-4">
                  <span className="min-w-0">
                    <span className="block font-semibold break-words">
                      {name}
                      <span className="ml-2 text-xs font-medium text-subtle-foreground">
                        {item.scope === "lokasi" ? "Titik absensi" : "Karyawan"}
                      </span>
                    </span>
                    <span className="block text-sm text-subtle-foreground tabular-nums">
                      {item.startTime} sampai {item.endTime}, {dayNames(item.workdays)}, toleransi{" "}
                      {item.lateToleranceMin} menit
                    </span>
                  </span>
                  <DeleteScheduleButton id={item.id} name={name} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
