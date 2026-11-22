import {
  CalendarCheckIn01Icon,
  Login03Icon,
  Logout03Icon,
  TaskDaily01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/state-message";
import { mustAttend } from "@/config/attendance";
import { PORTAL_AREAS, ROLE_HOME } from "@/config/portal";
import { featuresFor } from "@/config/portal-nav";
import { getMyAttendance, getMyWorkReports } from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { formatTimeWIB } from "@/lib/format";
import { HomeHeader } from "./home-header";
import { ModuleCards } from "./module-cards";
import { NextStepCard, type NextStep } from "./next-step-card";

const clock = (value: string) => formatTimeWIB(value).replace(" WIB", "");

async function AttendanceStats({ userId }: { userId: string }) {
  const [{ today, history }, reports] = await Promise.all([
    getMyAttendance(userId),
    getMyWorkReports(userId),
  ]);
  const step: NextStep = !today
    ? {
        pose: "melambai",
        title: "Belum clock in hari ini",
        text: "Foto wajah dan lokasi di titik absensi.",
        href: "/portal/absensi/masuk",
        action: "Clock in sekarang",
      }
    : !reports.rencana
      ? {
          pose: "clipboard",
          title: "Isi rencana kerja hari ini",
          text: "Wajib sebelum membuka modul lain.",
          href: "/portal/absensi/rencana",
          action: "Isi rencana",
        }
      : !today.clockOutAt
        ? {
            pose: "tablet",
            title: "Clock out saat pekerjaan selesai",
            text: "Setelah itu isi hasil kerja hari ini.",
            href: "/portal/absensi/pulang",
            action: "Clock out",
          }
        : !reports.hasil
          ? {
              pose: "clipboard",
              title: "Kirim hasil kerja hari ini",
              text: "Lampirkan foto kalau ada.",
              href: "/portal/absensi/hasil",
              action: "Isi hasil kerja",
            }
          : {
              pose: "jempol",
              title: "Absensi hari ini lengkap",
              text: "Terima kasih, sampai besok.",
              href: "/portal/absensi",
              action: "Lihat riwayat",
            };
  return (
    <>
      <NextStepCard step={step} />
      <section aria-labelledby="status-hari-ini" className="grid gap-3">
        <h2 id="status-hari-ini" className="text-sm font-semibold">
          Status hari ini
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Login03Icon}
            tone="green"
            label={
              today && today.lateMinutes > 0
                ? `Terlambat ${String(today.lateMinutes)} menit`
                : "Clock in"
            }
            value={today ? clock(today.clockInAt) : "Belum"}
            href="/portal/absensi"
          />
          <StatCard
            icon={TaskDaily01Icon}
            tone="violet"
            label="Rencana kerja"
            value={reports.rencana ? "Terisi" : "Belum"}
            href="/portal/absensi"
          />
          <StatCard
            icon={Logout03Icon}
            tone="orange"
            label="Clock out"
            value={today?.clockOutAt ? clock(today.clockOutAt) : "Belum"}
            href="/portal/absensi"
          />
          <StatCard
            icon={CalendarCheckIn01Icon}
            tone="blue"
            label="Hadir 7 hari terakhir"
            value={`${String(history.length)} hari`}
            href="/portal/absensi"
          />
        </div>
      </section>
    </>
  );
}

export async function ModulePlaceholder({ prefix }: { prefix: string }) {
  const area = PORTAL_AREAS.find((item) => item.prefix === prefix);
  if (!area) throw new Error(`Area portal tidak dikenal: ${prefix}`);
  const user = await requirePortalUser(area.roles);
  if (ROLE_HOME[user.role] !== prefix) {
    return (
      <div className="grid gap-5">
        <PageHeader title={area.label} />
        <EmptyState icon={Wrench01Icon} title={`Modul ${area.label} sedang disiapkan`} />
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      <HomeHeader roles={user.roles} description={area.label} />
      {mustAttend(user.roles) ? <AttendanceStats userId={user.id} /> : null}
      <section aria-labelledby="fitur" className="grid gap-3 lg:hidden">
        <h2 id="fitur" className="text-sm font-semibold">
          Fitur
        </h2>
        <ModuleCards label={`Modul ${area.label}`} modules={featuresFor(user.roles, user.role)} />
      </section>
    </div>
  );
}
