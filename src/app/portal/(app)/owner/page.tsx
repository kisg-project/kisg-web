import type { Metadata } from "next";
import {
  BadgeDollarSign,
  CalendarCheck,
  ClipboardSignature,
  HardHat,
  LayoutTemplate,
  Target,
  UsersRound,
} from "lucide-react";
import { requirePortalUser } from "@/features/auth";
import { avatarUrl } from "@/features/users";
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
    href: "/portal/owner",
    title: "Absensi",
    description: "Kehadiran harian, titik absensi, jam kerja, dan pengajuan di luar lokasi.",
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
  return (
    <div className="grid gap-6">
      <PortalGreeting
        fullName={user.fullName}
        roles={user.roles}
        avatarUrl={await avatarUrl(user.avatarPath)}
      />
      <h2 className="text-xl font-bold">Dashboard owner</h2>
      <ModuleCards label="Modul owner" modules={MODULES} />
    </div>
  );
}
