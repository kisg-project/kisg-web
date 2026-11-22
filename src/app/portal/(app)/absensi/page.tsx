import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDataTransferHorizontalIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  ClipboardCheckIcon,
  Clock01Icon,
  Location01Icon,
  Login03Icon,
  Logout03Icon,
  TaskDaily01Icon,
} from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { PORTAL_AREAS } from "@/config/portal";
import { getMyAttendance, getMyWorkReports, type AttendanceDay } from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { formatDateWIB, formatTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Absensi" };

const ROLES = PORTAL_AREAS.find((area) => area.prefix === "/portal/absensi")?.roles ?? [];

const EXCEPTION = {
  menunggu: { label: "Menunggu persetujuan", tone: "bg-warning-100 text-warning-800" },
  disetujui: { label: "Disetujui", tone: "bg-success-100 text-success-800" },
  ditolak: { label: "Ditolak", tone: "bg-danger-100 text-danger-700" },
} as const;

type Step = "masuk" | "rencana" | "pulang" | "hasil";

const STEP: Record<Step, { title: string; action: string; icon: AppIcon; tone: string }> = {
  masuk: {
    title: "Clock in",
    action: "Clock in sekarang",
    icon: Login03Icon,
    tone: "bg-primary-100 text-primary-800",
  },
  rencana: {
    title: "Rencana kegiatan",
    action: "Isi rencana kegiatan",
    icon: TaskDaily01Icon,
    tone: "bg-violet-100 text-violet-700",
  },
  pulang: {
    title: "Clock out",
    action: "Clock out sekarang",
    icon: Logout03Icon,
    tone: "bg-orange-100 text-orange-700",
  },
  hasil: {
    title: "Hasil kerja",
    action: "Isi hasil kerja",
    icon: ClipboardCheckIcon,
    tone: "bg-info-100 text-info-700",
  },
};

const dayFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" });
const monthFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
});

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

function StepTile({
  step,
  done,
  current,
  detail,
  editHref,
}: {
  step: Step;
  done: boolean;
  current: boolean;
  detail: string;
  editHref?: string;
}) {
  const { title, icon, tone } = STEP[step];
  return (
    <li
      className={cn(
        "relative flex min-w-0 flex-col gap-2 rounded-xl border p-3",
        current ? "border-primary-700 bg-primary-50 dark:bg-primary-950" : "border-(--line-soft)",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            done ? "bg-success-600 text-white" : tone,
          )}
        >
          <Icon icon={done ? CheckmarkCircle02Icon : icon} className="size-4" />
        </span>
        {editHref ? (
          <Link
            href={editHref}
            aria-label={`Ubah ${title.toLowerCase()}`}
            className="-m-2 inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50"
          >
            Ubah
          </Link>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground tabular-nums">{detail}</span>
      </span>
    </li>
  );
}

function HistoryRow({ day }: { day: AttendanceDay }) {
  const date = new Date(day.workDate);
  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-neutral-100 leading-none dark:bg-neutral-800">
        <span className="text-base font-semibold tabular-nums">{dayFormat.format(date)}</span>
        <span className="text-[0.625rem] text-muted-foreground uppercase">
          {monthFormat.format(date).replace(".", "")}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] font-semibold capitalize">
          <span className="sr-only">{formatDateWIB(day.workDate)}, </span>
          {weekdayFormat.format(date)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <Icon icon={Clock01Icon} className="size-3.5" />
          {formatTimeWIB(day.clockInAt)} sampai{" "}
          {day.clockOutAt ? formatTimeWIB(day.clockOutAt) : "belum clock out"}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {day.lateMinutes > 0 ? (
          <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-warning-800">
            Terlambat {day.lateMinutes} menit
          </span>
        ) : (
          <span className="rounded-full bg-success-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-success-800">
            Tepat waktu
          </span>
        )}
        {day.movedLocation ? (
          <span className="rounded-full bg-info-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-info-800">
            Pindah lokasi
          </span>
        ) : null}
      </span>
    </li>
  );
}

export default async function AttendancePage() {
  const user = await requirePortalUser(ROLES, { skipWorkReport: true });
  const [{ today, history, exceptions }, reports] = await Promise.all([
    getMyAttendance(user.id),
    getMyWorkReports(user.id),
  ]);
  const next = nextStep(today, reports);

  return (
    <div className="tone-green grid gap-4">
      <PageHeader title="Absensi" description={formatDateWIB(new Date())} />

      <section aria-labelledby="absen-hari-ini" className="grid gap-3 app-card p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="absen-hari-ini" className="text-sm font-semibold">
            Hari ini
          </h2>
          {today?.movedLocation ? (
            <span className="flex items-center gap-1 rounded-full bg-info-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-info-800">
              <Icon icon={ArrowDataTransferHorizontalIcon} className="size-3.5" />
              Pindah lokasi
            </span>
          ) : null}
        </div>
        <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StepTile
            step="masuk"
            done={Boolean(today)}
            current={next === "masuk"}
            detail={
              today
                ? `${formatTimeWIB(today.clockInAt)}${today.lateMinutes > 0 ? `, terlambat ${String(today.lateMinutes)} menit` : ""}`
                : "Foto dan lokasi"
            }
          />
          <StepTile
            step="rencana"
            done={Boolean(reports.rencana)}
            current={next === "rencana"}
            detail={reports.rencana ? formatTimeWIB(reports.rencana.updatedAt) : "Setelah clock in"}
            editHref={reports.rencana && !reports.hasil ? "/portal/absensi/rencana" : undefined}
          />
          <StepTile
            step="pulang"
            done={Boolean(today?.clockOutAt)}
            current={next === "pulang"}
            detail={today?.clockOutAt ? formatTimeWIB(today.clockOutAt) : "Saat pulang"}
          />
          <StepTile
            step="hasil"
            done={Boolean(reports.hasil)}
            current={next === "hasil"}
            detail={reports.hasil ? formatTimeWIB(reports.hasil.updatedAt) : "Setelah clock out"}
            editHref={reports.hasil ? "/portal/absensi/hasil" : undefined}
          />
        </ol>
        {today ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon icon={Location01Icon} className="size-3.5" />
            {today.clockInLocation ?? "Titik absensi"}
            {today.clockOutLocation && today.movedLocation
              ? `, pulang di ${today.clockOutLocation}`
              : ""}
          </p>
        ) : null}
        {next ? (
          <Button asChild size="lg" className="h-12 w-full rounded-xl text-sm">
            <Link href={`/portal/absensi/${next}`}>
              <Icon icon={STEP[next].icon} />
              {STEP[next].action}
              <Icon icon={ArrowRight01Icon} className="arrow-nudge ml-auto" />
            </Link>
          </Button>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-success-50 px-3 py-3 text-[0.8125rem] font-semibold text-success-800 dark:bg-success-950 dark:text-success-200">
            <Icon icon={CheckmarkCircle02Icon} className="size-5" />
            Absensi dan laporan hari ini lengkap.
          </p>
        )}
      </section>

      {exceptions.length > 0 ? (
        <section aria-labelledby="pengajuan-luar" className="grid gap-2">
          <h2 id="pengajuan-luar" className="px-1 text-sm font-semibold">
            Pengajuan di luar lokasi
          </h2>
          <ul className="divide-y divide-(--line-soft) app-card">
            {exceptions.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3.5 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Icon icon={Location01Icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-[0.8125rem] font-semibold">
                  {item.kind === "masuk" ? "Clock in" : "Clock out"}
                  <span className="block text-xs font-normal text-muted-foreground tabular-nums">
                    {formatTimeWIB(item.requestedAt)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                    EXCEPTION[item.status].tone,
                  )}
                >
                  {EXCEPTION[item.status].label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="riwayat-absen" className="grid gap-2">
        <h2 id="riwayat-absen" className="px-1 text-sm font-semibold">
          7 hari terakhir
        </h2>
        {history.length === 0 ? (
          <EmptyState title="Belum ada riwayat absensi" />
        ) : (
          <ul aria-label="Riwayat absensi" className="divide-y divide-(--line-soft) app-card">
            {history.map((day) => (
              <HistoryRow key={day.id} day={day} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
