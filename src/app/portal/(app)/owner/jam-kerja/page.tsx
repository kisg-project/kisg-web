import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { WEEKDAYS } from "@/config/attendance";
import { requirePortalUser } from "@/features/auth";
import {
  DeleteScheduleButton,
  ScheduleDialog,
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
    <div className="tone-orange grid gap-4">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke beranda"
        title="Jam kerja"
        description="Lewat jam masuk ditambah toleransi dicatat terlambat"
        actions={<ScheduleDialog locations={locationChoices} employees={employees} />}
      />
      <section
        aria-labelledby="jam-perusahaan-judul"
        className="rounded-xl border border-(--line-strong) bg-card p-4"
      >
        <h2 id="jam-perusahaan-judul" className="mb-0.5 text-sm font-semibold">
          Jam kerja perusahaan
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
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
      <section aria-labelledby="daftar-jam-khusus" className="grid gap-3">
        <h2 id="daftar-jam-khusus" className="text-sm font-semibold">
          Jam khusus
        </h2>
        {overrides.length === 0 ? (
          <EmptyState title="Belum ada jam khusus" />
        ) : (
          <ul
            aria-label="Daftar jam khusus"
            className="divide-y divide-(--line-soft) rounded-xl border border-(--line-strong) bg-card"
          >
            {overrides.map((item) => {
              const name = item.targetName ?? "Tanpa nama";
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-semibold break-words">
                      {name}
                      <span className="ml-2 text-xs font-medium text-subtle-foreground">
                        {item.scope === "lokasi" ? "Titik absensi" : "Karyawan"}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
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
