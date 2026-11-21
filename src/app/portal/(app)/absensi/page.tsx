import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, LogIn, LogOut, MapPin, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PORTAL_AREAS } from "@/config/portal";
import { getMyAttendance, type AttendanceDay } from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { formatDateWIB, formatTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Absensi" };

const ROLES = PORTAL_AREAS.find((area) => area.prefix === "/portal/absensi")?.roles ?? [];

const EXCEPTION_LABEL = {
  menunggu: "Menunggu persetujuan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
} as const;

function StepRow({
  icon: Icon,
  title,
  done,
  detail,
}: {
  icon: typeof LogIn;
  title: string;
  done: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl",
          done ? "bg-success-100 text-success-700" : "bg-surface text-subtle-foreground",
        )}
      >
        {done ? (
          <CheckCircle2 aria-hidden="true" className="size-5" />
        ) : (
          <Icon aria-hidden="true" className="size-5" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-subtle-foreground">{detail}</span>
      </span>
    </li>
  );
}

function HistoryItem({ day }: { day: AttendanceDay }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 app-card p-4">
      <span className="font-semibold">{formatDateWIB(day.workDate)}</span>
      <span className="flex flex-wrap items-center gap-2 text-sm text-subtle-foreground tabular">
        <span>
          {formatTimeWIB(day.clockInAt)} sampai{" "}
          {day.clockOutAt ? formatTimeWIB(day.clockOutAt) : "belum clock out"}
        </span>
        {day.lateMinutes > 0 ? (
          <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-semibold text-warning-800">
            Terlambat {day.lateMinutes} menit
          </span>
        ) : null}
        {day.movedLocation ? (
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800">
            Pindah lokasi
          </span>
        ) : null}
      </span>
    </li>
  );
}

/**
 * Absensi harian karyawan: status hari ini sebagai langkah, satu tombol aksi utama yang selalu menunjuk
 * langkah berikutnya, pengajuan di luar lokasi, dan riwayat 7 hari.
 */
export default async function AttendancePage() {
  const user = await requirePortalUser(ROLES);
  const { today, history, exceptions } = await getMyAttendance(user.id);
  const next = !today ? "masuk" : today.clockOutAt ? null : "pulang";

  return (
    <div className="grid gap-6">
      <PageHeader title="Absensi" description={formatDateWIB(new Date())} />

      <section aria-labelledby="absen-hari-ini" className="grid gap-5 app-card p-5 sm:p-6">
        <h2 id="absen-hari-ini" className="text-lg font-bold">
          Hari ini
        </h2>
        <ol className="grid gap-4">
          <StepRow
            icon={LogIn}
            title="Clock in"
            done={Boolean(today)}
            detail={
              today
                ? `${formatTimeWIB(today.clockInAt)} di ${today.clockInLocation ?? "titik absensi"}${today.lateMinutes > 0 ? `, terlambat ${String(today.lateMinutes)} menit` : ""}`
                : "Foto wajah dan lokasi di titik absensi."
            }
          />
          <StepRow
            icon={LogOut}
            title="Clock out"
            done={Boolean(today?.clockOutAt)}
            detail={
              today?.clockOutAt
                ? `${formatTimeWIB(today.clockOutAt)} di ${today.clockOutLocation ?? "titik absensi"}`
                : "Setelah pekerjaan hari ini selesai."
            }
          />
        </ol>
        {today?.movedLocation ? (
          <p className="flex items-center gap-2 text-sm text-subtle-foreground">
            <Shuffle aria-hidden="true" className="size-4" />
            Clock in dan clock out di titik berbeda.
          </p>
        ) : null}
        {next ? (
          <Button asChild size="lg" className="h-14 w-full rounded-2xl text-base">
            <Link href={`/portal/absensi/${next}`}>
              {next === "masuk" ? <LogIn aria-hidden="true" /> : <LogOut aria-hidden="true" />}
              {next === "masuk" ? "Clock in sekarang" : "Clock out sekarang"}
            </Link>
          </Button>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-success-50 p-4 font-semibold text-success-800">
            <CheckCircle2 aria-hidden="true" className="size-5" />
            Absensi hari ini lengkap.
          </p>
        )}
      </section>

      {exceptions.length > 0 ? (
        <section aria-labelledby="pengajuan-luar" className="grid gap-3">
          <h2 id="pengajuan-luar" className="text-lg font-bold">
            Pengajuan di luar lokasi
          </h2>
          <ul className="grid gap-2">
            {exceptions.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 app-card p-4"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <MapPin aria-hidden="true" className="size-4" />
                  {item.kind === "masuk" ? "Clock in" : "Clock out"} pukul{" "}
                  {formatTimeWIB(item.requestedAt)}
                </span>
                <span className="rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning-800">
                  {EXCEPTION_LABEL[item.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="riwayat-absen" className="grid gap-3">
        <h2 id="riwayat-absen" className="flex items-center gap-2 text-lg font-bold">
          <Clock aria-hidden="true" className="size-5" />7 hari terakhir
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-subtle-foreground">Belum ada riwayat absensi.</p>
        ) : (
          <ul aria-label="Riwayat absensi" className="grid gap-2">
            {history.map((day) => (
              <HistoryItem key={day.id} day={day} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
