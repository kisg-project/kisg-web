import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert02Icon,
  ArrowRight01Icon,
  Note01Icon,
  TaskDaily01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ROLE_HOME } from "@/config/portal";
import { featuresFor } from "@/config/portal-nav";
import {
  AttendanceTrendCard,
  getAttendanceOverview,
  getAttendanceTrend,
  listWorkSchedules,
  todayWib,
} from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { ModuleCards } from "../_components/module-cards";
import { HomeHeader } from "../_components/home-header";
import { NextStepCard } from "../_components/next-step-card";
import { AttendanceTable, type AttendanceRow } from "./_components/attendance-table";
import { ScheduleWidget } from "./_components/schedule-widget";
import { ApprovalsWidget, WorkHoursWidget } from "./_components/today-widgets";

export const metadata: Metadata = { title: "Dashboard direktur utama" };

export default async function OwnerPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  const isHome = ROLE_HOME[user.role] === "/portal/owner";
  const [trend, overview, schedules] = await Promise.all([
    getAttendanceTrend(14),
    getAttendanceOverview(todayWib()),
    listWorkSchedules(),
  ]);
  const pending = overview.pending.length;
  const company = schedules.find((item) => item.scope === "perusahaan") ?? null;
  const rows: AttendanceRow[] = overview.employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    location: employee.day?.clockInLocation ?? null,
    present: Boolean(employee.day),
    late: employee.day?.lateMinutes ?? 0,
    outside: employee.day?.outside ?? false,
    rencana: Boolean(employee.rencana),
    hasil: Boolean(employee.hasil),
  }));
  const today = trend.at(-1);
  const present = today ? today.onTime + today.late : 0;
  const expected = today ? present + today.absent : 0;
  const reports = today?.reportsComplete ?? null;
  return (
    <div className="tone-mint grid gap-5">
      {isHome ? (
        <HomeHeader
          roles={user.roles}
          description={
            pending > 0
              ? `${String(pending)} pengajuan menunggu persetujuan`
              : "Tidak ada pengajuan yang menunggu"
          }
        />
      ) : (
        <PageHeader title="Dashboard direktur utama" />
      )}
      {isHome ? (
        <NextStepCard
          step={
            pending > 0
              ? {
                  pose: "tablet",
                  title: `${String(pending)} pengajuan menunggu persetujuan`,
                  text: "Periksa sebelum jam pulang.",
                  href: "/portal/owner/absensi",
                  action: "Periksa sekarang",
                }
              : {
                  pose: "jempol",
                  title: `Kehadiran hari ini ${String(present)} dari ${String(expected)}`,
                  text:
                    expected - present > 0
                      ? `${String(expected - present)} karyawan belum clock in.`
                      : "Semua karyawan sudah clock in.",
                  href: "/portal/owner/absensi",
                  action: "Lihat kehadiran",
                }
          }
        />
      ) : null}
      <section aria-labelledby="dashboard-utama" className="grid gap-3">
        <h2 id="dashboard-utama" className="text-sm font-semibold">
          Dashboard direktur utama
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={UserCheck01Icon}
            tone="green"
            label="Hadir hari ini"
            value={`${String(present)}/${String(expected)}`}
            href="/portal/owner/absensi"
          />
          <StatCard
            icon={Alert02Icon}
            tone="orange"
            label="Terlambat"
            value={String(today?.late ?? 0)}
            href="/portal/owner/absensi"
          />
          <StatCard
            icon={TaskDaily01Icon}
            tone="violet"
            label="Perlu persetujuan"
            value={String(pending)}
            href="/portal/owner/absensi"
          />
          <StatCard
            icon={Note01Icon}
            tone="blue"
            label="Laporan lengkap"
            value={reports === null ? "-" : `${String(reports)}%`}
            href="/portal/owner/absensi"
          />
        </div>
      </section>
      <section aria-labelledby="fitur" className="grid gap-3 lg:hidden">
        <h2 id="fitur" className="text-sm font-semibold">
          Fitur
        </h2>
        <ModuleCards label="Modul owner" modules={featuresFor(user.roles, user.role)} />
      </section>
      <section aria-labelledby="ringkasan-kehadiran" className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="ringkasan-kehadiran" className="text-sm font-semibold">
            Ringkasan kehadiran
          </h2>
          <Link
            href="/portal/owner/absensi"
            className="hit-44 inline-flex h-9 items-center gap-1 rounded-lg border border-(--line-strong) bg-card px-3 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Buka rekap kehadiran
            <Icon icon={ArrowRight01Icon} className="arrow-nudge size-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <WorkHoursWidget
            schedule={company}
            workday={today?.workday ?? true}
            summary={{
              total: expected,
              present,
              late: today?.late ?? 0,
              absent: today?.absent ?? 0,
            }}
          />
          <ApprovalsWidget pending={overview.pending} decided={overview.decided} />
          <AttendanceTrendCard days={trend} className="lg:col-span-2 xl:col-span-1" />
          <AttendanceTable rows={rows} className="lg:col-span-2" />
          <ScheduleWidget days={trend} schedule={company} />
        </div>
      </section>
    </div>
  );
}
