import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert02Icon,
  ArrowRight01Icon,
  Building03Icon,
  CalendarCheckIn01Icon,
  Clock01Icon,
  Invoice01Icon,
  Location01Icon,
  Money03Icon,
  Note01Icon,
  Target02Icon,
  TaskDaily01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  WebDesign01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ROLE_HOME } from "@/config/portal";
import {
  AttendanceCharts,
  countPendingExceptions,
  getAttendanceTrend,
} from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { ModuleCards, type PortalModule } from "../_components/module-cards";
import { PortalGreeting } from "../_components/portal-greeting";

export const metadata: Metadata = { title: "Dashboard direktur utama" };

const MODULES: readonly PortalModule[] = [
  {
    href: "/portal/owner/absensi",
    title: "Kehadiran",
    icon: CalendarCheckIn01Icon,
    tone: "green",
    ready: true,
  },
  {
    href: "/portal/owner/karyawan",
    title: "Karyawan",
    icon: UserGroupIcon,
    tone: "violet",
    ready: true,
  },
  {
    href: "/portal/owner/titik-absensi",
    title: "Titik absensi",
    icon: Location01Icon,
    tone: "blue",
    ready: true,
  },
  {
    href: "/portal/owner/jam-kerja",
    title: "Jam kerja",
    icon: Clock01Icon,
    tone: "orange",
    ready: true,
  },
  { href: "/portal/owner", title: "Pengajuan", icon: Invoice01Icon, tone: "amber", ready: false },
  { href: "/portal/owner", title: "Penggajian", icon: Money03Icon, tone: "gold", ready: false },
  { href: "/portal/owner", title: "Penjualan", icon: Target02Icon, tone: "red", ready: false },
  { href: "/portal/owner", title: "Lapangan", icon: Building03Icon, tone: "blue", ready: false },
  { href: "/portal/owner", title: "Notulen", icon: Note01Icon, tone: "violet", ready: false },
  {
    href: "/portal/owner",
    title: "Konten website",
    icon: WebDesign01Icon,
    tone: "green",
    ready: false,
  },
];

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
        <PortalGreeting fullName={user.fullName} roles={user.roles} />
      ) : (
        <PageHeader title="Dashboard direktur utama" />
      )}
      <section aria-labelledby="dashboard-utama" className="grid gap-3">
        <h2 id="dashboard-utama" className={isHome ? "text-base font-semibold" : "sr-only"}>
          {isHome ? "Dashboard direktur utama" : "Ringkasan hari ini"}
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
      <section aria-labelledby="fitur" className="grid gap-3">
        <h2 id="fitur" className="text-base font-semibold">
          Fitur
        </h2>
        <ModuleCards label="Modul owner" modules={MODULES} />
      </section>
      <section aria-labelledby="ringkasan-kehadiran" className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="ringkasan-kehadiran" className="text-base font-semibold">
            Ringkasan kehadiran
          </h2>
          <Link
            href="/portal/owner/absensi"
            className="inline-flex min-h-10 items-center gap-1 rounded-full border border-(--line-strong) bg-card px-3 text-xs font-medium hover:bg-neutral-50"
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
