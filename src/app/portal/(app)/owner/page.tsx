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
  AttendanceCharts,
  countPendingExceptions,
  getAttendanceTrend,
} from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { ModuleCards } from "../_components/module-cards";
import { HomeHeader } from "../_components/home-header";

export const metadata: Metadata = { title: "Dashboard direktur utama" };

export default async function OwnerPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  const isHome = ROLE_HOME[user.role] === "/portal/owner";
  const [trend, pending] = await Promise.all([getAttendanceTrend(14), countPendingExceptions()]);
  const today = trend.at(-1);
  const present = today ? today.onTime + today.late : 0;
  const expected = today ? present + today.absent : 0;
  const reports = today?.reportsComplete ?? null;
  return (
    <div className="grid gap-5">
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
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-(--line-strong) bg-card px-3 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Buka rekap kehadiran
            <Icon icon={ArrowRight01Icon} className="size-4" />
          </Link>
        </div>
        <AttendanceCharts days={trend} />
      </section>
    </div>
  );
}
