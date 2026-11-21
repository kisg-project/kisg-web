import type { Metadata } from "next";
import {
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
import { PageHeader } from "@/components/shared/page-header";
import { ROLE_HOME } from "@/config/portal";
import { requirePortalUser } from "@/features/auth";
import { ModuleCards, type PortalModule } from "../_components/module-cards";
import { PortalGreeting } from "../_components/portal-greeting";

export const metadata: Metadata = { title: "Dashboard owner" };

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
    href: "/portal/owner",
    title: "Kehadiran",
    description: "Rekap kehadiran harian dan pengajuan absen di luar lokasi.",
    icon: CalendarCheck,
    ready: false,
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
  return (
    <div className="grid gap-6">
      {isHome ? (
        <>
          <PortalGreeting fullName={user.fullName} roles={user.roles} />
          <h2 className="text-xl font-bold">Dashboard owner</h2>
        </>
      ) : (
        <PageHeader title="Dashboard owner" description={`Masuk sebagai ${user.fullName}.`} />
      )}
      <ModuleCards label="Modul owner" modules={MODULES} />
    </div>
  );
}
