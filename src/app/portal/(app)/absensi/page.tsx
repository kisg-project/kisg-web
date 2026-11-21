import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Shuffle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PORTAL_AREAS } from "@/config/portal";
import { getMyAttendance, getMyWorkReports, type AttendanceDay } from "@/features/attendance";
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
  editHref,
}: {
  icon: typeof LogIn;
  title: string;
  done: boolean;
  detail: string;
  editHref?: string;
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
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-subtle-foreground">{detail}</span>
      </span>
      {editHref ? (
        <Link
          href={editHref}
          aria-label={`Ubah ${title.toLowerCase()}`}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-50"
        >
          Ubah
        </Link>
      ) : null}
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

type Step = "masuk" | "rencana" | "pulang" | "hasil";

const STEP_ACTION: Record<Step, { label: string; icon: typeof LogIn }> = {
  masuk: { label: "Clock in sekarang", icon: LogIn },
  rencana: { label: "Isi rencana kegiatan", icon: ClipboardList },
  pulang: { label: "Clock out sekarang", icon: LogOut },
  hasil: { label: "Isi hasil kerja", icon: ClipboardCheck },
};

/** Urutan wajib: clock in, rencana, clock out, hasil kerja. */
function nextStep(
  today: AttendanceDay | null,
  reports: { rencana: unknown; hasil: unknown },
): Step | null {
  if (!today) return "masuk";
  if (!reports.rencana) return "rencana";
  if (!today.clockOutAt) return "pulang";
  if (!reports.hasil) return "hasil";
  return null;
}

function NextAction({ step }: { step: Step }) {
  const { label, icon: Icon } = STEP_ACTION[step];
  return (
    <Button asChild size="lg" className="h-14 w-full rounded-2xl text-base">
      <Link href={`/portal/absensi/${step}`}>
        <Icon aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}

/**
 * Absensi harian karyawan: status hari ini sebagai langkah, satu tombol aksi utama yang selalu menunjuk
 * langkah berikutnya, pengajuan di luar lokasi, dan riwayat 7 hari.
 */
export default async function AttendancePage() {
  const user = await requirePortalUser(ROLES, { skipWorkReport: true });
  const [{ today, history, exceptions }, reports] = await Promise.all([
    getMyAttendance(user.id),
    getMyWorkReports(user.id),
  ]);
  const next = nextStep(today, reports);

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
            icon={ClipboardList}
            title="Rencana kegiatan"
            done={Boolean(reports.rencana)}
            detail={
              reports.rencana
                ? `Tersimpan pukul ${formatTimeWIB(reports.rencana.updatedAt)}`
                : "Diisi setelah clock in."
            }
            editHref={reports.rencana && !reports.hasil ? "/portal/absensi/rencana" : undefined}
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
          <StepRow
            icon={ClipboardCheck}
            title="Hasil kerja"
            done={Boolean(reports.hasil)}
            detail={
              reports.hasil
                ? `Terkirim pukul ${formatTimeWIB(reports.hasil.updatedAt)}`
                : "Diisi setelah clock out."
            }
            editHref={reports.hasil ? "/portal/absensi/hasil" : undefined}
          />
        </ol>
        {today?.movedLocation ? (
          <p className="flex items-center gap-2 text-sm text-subtle-foreground">
            <Shuffle aria-hidden="true" className="size-4" />
            Clock in dan clock out di titik berbeda.
          </p>
        ) : null}
        {next ? (
          <NextAction step={next} />
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-success-50 p-4 font-semibold text-success-800">
            <CheckCircle2 aria-hidden="true" className="size-5" />
            Absensi dan laporan hari ini lengkap.
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
