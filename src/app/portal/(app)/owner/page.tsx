import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  ClipboardSignature,
  Clock,
  HardHat,
  LayoutTemplate,
  MapPin,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
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
    href: "/portal/owner/karyawan",
    title: "Karyawan",
    description: "Undang karyawan, atur role dan rangkap jabatan, nonaktifkan akun.",
    icon: UsersRound,
    ready: true,
  },
  {
    href: "/portal/owner/titik-absensi",
    title: "Titik absensi",
    description: "Kantor dan lokasi proyek tempat karyawan absen, dengan radius 100 meter.",
    icon: MapPin,
    ready: true,
  },
  {
    href: "/portal/owner/jam-kerja",
    title: "Jam kerja",
    description: "Jam masuk, jam pulang, hari kerja, dan toleransi terlambat.",
    icon: Clock,
    ready: true,
  },
  {
    href: "/portal/owner/absensi",
    title: "Kehadiran",
    description: "Rekap kehadiran harian, laporan kerja, dan persetujuan absen di luar lokasi.",
    icon: CalendarCheck,
    ready: true,
  },
  {
    href: "/portal/owner",
    title: "Pengajuan dan persetujuan",
    description: "Pengajuan dana dari semua divisi, persetujuan digital, dan arsip PDF.",
    icon: ClipboardSignature,
    ready: false,
  },
  {
    href: "/portal/owner",
    title: "Penggajian",
    description: "Persetujuan gaji per periode dan pengiriman slip gaji.",
    icon: BadgeDollarSign,
    ready: false,
  },
  {
    href: "/portal/owner",
    title: "Penjualan",
    description: "Lead, booking, dan kinerja marketing.",
    icon: Target,
    ready: false,
  },
  {
    href: "/portal/owner",
    title: "Lapangan",
    description: "Progres pembangunan dan laporan harian proyek.",
    icon: HardHat,
    ready: false,
  },
  {
    href: "/portal/owner",
    title: "Konten website",
    description: "Banner, proyek, berita, promo, dan lowongan di panel CMS.",
    icon: LayoutTemplate,
    ready: false,
  },
];

export default async function OwnerPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  // Beranda owner memakai sapaan sebagai h1. Akun lain (misal admin lama) melihat judul halaman biasa.
  const isHome = ROLE_HOME[user.role] === "/portal/owner";
  const [trend, pending] = await Promise.all([getAttendanceTrend(14), countPendingExceptions()]);
  const today = trend.at(-1);
  const stats = today
    ? [
        {
          label: "Hadir hari ini",
          value: `${String(today.onTime + today.late)}/${String(today.onTime + today.late + today.absent)}`,
        },
        { label: "Terlambat", value: String(today.late) },
        { label: "Persetujuan", value: String(pending) },
      ]
    : [];
  return (
    <div className="grid gap-6">
      {isHome ? (
        <>
          <PortalGreeting fullName={user.fullName} roles={user.roles} stats={stats} />
        </>
      ) : (
        <PageHeader
          title="Dashboard direktur utama"
          description={`Masuk sebagai ${user.fullName}.`}
        />
      )}
      <section aria-labelledby="ringkasan-kehadiran" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ringkasan-kehadiran" className="text-xl font-bold">
            Ringkasan kehadiran
          </h2>
          <Link
            href="/portal/owner/absensi"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-50"
          >
            Buka rekap kehadiran
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <AttendanceCharts days={trend} />
      </section>
      {isHome ? <h2 className="text-xl font-bold">Dashboard direktur utama</h2> : null}
      <ModuleCards label="Modul owner" modules={MODULES} />
    </div>
  );
}
