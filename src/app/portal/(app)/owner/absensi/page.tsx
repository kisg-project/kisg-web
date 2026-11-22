import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ClipboardCheckIcon,
  File01Icon,
  Location01Icon,
  SecurityCheckIcon,
  Task01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import { Avatar } from "@/components/shared/avatar";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/state-message";
import { APPROVAL_DECISION_LABEL, verificationPath } from "@/config/approvals";
import { env } from "@/env";
import {
  ExceptionDecision,
  getAttendanceOverview,
  todayWib,
  type OverviewEmployee,
  type OverviewException,
} from "@/features/attendance";
import { activeCredential } from "@/features/approvals/server";
import { requirePortalUser } from "@/features/auth";
import { formatDateWIB, formatTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kehadiran" };

const BASE = "/portal/owner/absensi";

function shiftDate(date: string, days: number): string {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function pickDate(value: string | string[] | undefined, today: string): string {
  const text = typeof value === "string" ? value : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) return today;
  return text > today ? today : text;
}

const CHIP = {
  warning: {
    tone: "bg-warning-50 text-warning-800 dark:bg-warning-950 dark:text-warning-200",
    dot: "bg-warning-500",
  },
  primary: {
    tone: "bg-info-50 text-info-800 dark:bg-info-950 dark:text-info-200",
    dot: "bg-info-500",
  },
  success: {
    tone: "bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-200",
    dot: "bg-success-600",
  },
  muted: {
    tone: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    dot: "bg-neutral-500",
  },
} as const;

function Chip({ tone, children }: { tone: keyof typeof CHIP; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
        CHIP[tone].tone,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", CHIP[tone].dot)} />
      {children}
    </span>
  );
}

function Selfie({ src, name }: { src: string | null; name: string }) {
  if (!src) return <Avatar src={null} name={name} className="size-9" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed URL privat berumur pendek, tidak lewat optimasi gambar
    <img
      src={src}
      alt={`Foto clock in ${name}`}
      className="size-9 shrink-0 rounded-full object-cover ring-1 ring-(--line-strong)"
    />
  );
}

function ReportBlock({
  title,
  icon,
  report,
}: {
  title: string;
  icon: AppIcon;
  report: OverviewEmployee["rencana"];
}) {
  if (!report) {
    return (
      <p className="flex min-h-9 items-center gap-2 rounded-lg border border-dashed border-(--line-soft) px-2.5 text-xs text-muted-foreground">
        <Icon icon={icon} className="size-4" />
        {title}: belum diisi
      </p>
    );
  }
  return (
    <details className="group rounded-lg border border-(--line-soft) bg-(--band-soft) px-2.5 py-1">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-xs font-semibold">
        <Icon icon={icon} className="size-4 text-primary" />
        {title}
        <span className="font-normal text-subtle-foreground tabular">
          {formatTimeWIB(report.updatedAt)}
        </span>
      </summary>
      <p className="mt-1 mb-1.5 text-xs whitespace-pre-line">{report.content}</p>
      {report.attachments.length > 0 ? (
        <ul aria-label={`Lampiran ${title.toLowerCase()}`} className="mt-3 flex flex-wrap gap-2">
          {report.attachments.map((item) =>
            item.url ? (
              <li key={item.url}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-3 text-sm font-semibold hover:bg-accent"
                >
                  <Icon icon={File01Icon} className="size-4" />
                  {item.name}
                </a>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </details>
  );
}

const ROW = "lg:grid-cols-[minmax(0,2fr)_6rem_6rem_minmax(0,1.6fr)]";

function EmployeeRow({ employee }: { employee: OverviewEmployee }) {
  const day = employee.day;
  return (
    <li className={cn("grid gap-x-4 gap-y-2 px-4 py-3", ROW)}>
      <div className="flex min-w-0 items-center gap-3">
        <Selfie src={day?.selfieIn ?? null} name={employee.name} />
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-semibold">{employee.name}</p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {day ? (
              <>
                <span className="lg:hidden">
                  {formatTimeWIB(day.clockInAt)} sampai{" "}
                  {day.clockOutAt ? formatTimeWIB(day.clockOutAt) : "belum clock out"}
                  {day.clockInLocation ? ", " : ""}
                </span>
                {day.clockInLocation ?? ""}
              </>
            ) : (
              "Belum ada catatan"
            )}
          </p>
        </div>
      </div>
      <span className="hidden self-center text-center text-xs tabular-nums lg:block">
        {day ? formatTimeWIB(day.clockInAt) : "-"}
      </span>
      <span className="hidden self-center text-center text-xs tabular-nums lg:block">
        {day?.clockOutAt ? formatTimeWIB(day.clockOutAt) : "-"}
      </span>
      <div className="flex flex-wrap content-center gap-1.5 lg:justify-center">
        {!day ? <Chip tone="muted">Belum absen</Chip> : null}
        {day && day.lateMinutes === 0 ? <Chip tone="success">Tepat waktu</Chip> : null}
        {day && day.lateMinutes > 0 ? (
          <Chip tone="warning">{`Terlambat ${String(day.lateMinutes)} menit`}</Chip>
        ) : null}
        {day && day.earlyMinutes > 0 ? (
          <Chip tone="warning">{`Pulang awal ${String(day.earlyMinutes)} menit`}</Chip>
        ) : null}
        {day?.outside ? <Chip tone="primary">Di luar lokasi</Chip> : null}
        {day?.movedLocation ? <Chip tone="primary">Pindah lokasi</Chip> : null}
      </div>
      {day ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:col-span-4">
          <ReportBlock title="Rencana kegiatan" icon={Task01Icon} report={employee.rencana} />
          <ReportBlock title="Hasil kerja" icon={ClipboardCheckIcon} report={employee.hasil} />
        </div>
      ) : null}
    </li>
  );
}

function ExceptionSummary({ item }: { item: OverviewException }) {
  return (
    <>
      <span className="font-semibold">{item.userName}</span>
      <span>
        {item.kind === "masuk" ? "Clock in" : "Clock out"} {formatDateWIB(item.requestedAt)} pukul{" "}
        {formatTimeWIB(item.requestedAt)}
      </span>
      <span>
        {item.nearestDistanceM !== null
          ? `${String(item.nearestDistanceM)} m dari ${item.nearestName ?? "titik terdekat"}`
          : "Jarak tidak diketahui"}
      </span>
      <span>Alasan: {item.reason}</span>
    </>
  );
}

function PendingCard({ item, fingerprint }: { item: OverviewException; fingerprint: boolean }) {
  return (
    <li className="grid gap-3 rounded-xl border border-(--line-strong) bg-card p-3.5">
      <div className="flex items-start gap-3">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL privat berumur pendek, tidak lewat optimasi gambar
          <img
            src={item.photoUrl}
            alt={`Foto pengajuan ${item.userName}`}
            className="size-14 shrink-0 rounded-xl object-cover"
          />
        ) : null}
        <div className="grid min-w-0 flex-1 gap-0.5 text-sm">
          <ExceptionSummary item={item} />
        </div>
      </div>
      <ExceptionDecision
        id={item.id}
        fingerprint={fingerprint}
        summary={<ExceptionSummary item={item} />}
      />
    </li>
  );
}

export default async function OwnerAttendancePage({
  searchParams,
}: PageProps<"/portal/owner/absensi">) {
  const user = await requirePortalUser(["owner", "admin"]);
  const today = todayWib();
  const date = pickDate((await searchParams).tanggal, today);
  const [overview, credential] = await Promise.all([
    getAttendanceOverview(date),
    activeCredential(user.id),
  ]);
  const { summary } = overview;
  const shortDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  const arrow =
    "hit-44 flex size-9 items-center justify-center rounded-lg border border-(--line-strong) bg-card text-foreground transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800";

  return (
    <div className="tone-green grid gap-5">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke dashboard"
        title="Kehadiran"
        description={formatDateWIB(date)}
        actions={
          <nav aria-label="Pilih tanggal" className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Link
                href={`${BASE}?tanggal=${shiftDate(date, -1)}`}
                aria-label="Hari sebelumnya"
                className={arrow}
              >
                <Icon icon={ArrowLeft01Icon} className="arrow-nudge-back size-4" />
              </Link>
              <span className="flex h-9 min-w-[6.5rem] items-center justify-center rounded-lg border border-(--line-strong) bg-card px-3 text-xs font-medium tabular-nums">
                {shortDate}
              </span>
              {date < today ? (
                <Link
                  href={`${BASE}?tanggal=${shiftDate(date, 1)}`}
                  aria-label="Hari berikutnya"
                  className={arrow}
                >
                  <Icon icon={ArrowRight01Icon} className="arrow-nudge size-4" />
                </Link>
              ) : (
                <span aria-hidden="true" className={cn(arrow, "opacity-30 hover:bg-transparent")}>
                  <Icon icon={ArrowRight01Icon} className="arrow-nudge size-4" />
                </span>
              )}
            </div>
            {date !== today ? (
              <Link
                href={BASE}
                className="hit-44 inline-flex h-9 items-center rounded-lg border border-primary-800 bg-primary-700 px-3 text-xs font-medium text-white hover:bg-primary-800"
              >
                Hari ini
              </Link>
            ) : null}
          </nav>
        }
      />

      <div
        aria-label="Ringkasan kehadiran"
        role="group"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <StatCard
          icon={UserGroupIcon}
          tone="blue"
          label="Wajib absen"
          value={String(summary.total)}
        />
        <StatCard
          icon={UserCheck01Icon}
          tone="green"
          label="Hadir"
          value={String(summary.present)}
        />
        <StatCard icon={Alert02Icon} tone="orange" label="Terlambat" value={String(summary.late)} />
        <StatCard
          icon={UserRemove01Icon}
          tone="red"
          label="Belum absen"
          value={String(summary.absent)}
        />
      </div>

      <section aria-labelledby="menunggu" className="grid gap-3">
        <h2 id="menunggu" className="flex items-center gap-2 text-base font-semibold">
          <Icon icon={Location01Icon} className="size-5" />
          Menunggu persetujuan
          {summary.pending > 0 ? (
            <span className="rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning-800 tabular">
              {summary.pending}
            </span>
          ) : null}
        </h2>
        {overview.pending.length === 0 ? (
          <EmptyState
            title="Tidak ada pengajuan yang menunggu"
            description="Pengajuan absen di luar lokasi dari karyawan muncul di sini."
          />
        ) : (
          <ul aria-label="Pengajuan menunggu" className="grid gap-3 lg:grid-cols-2">
            {overview.pending.map((item) => (
              <PendingCard key={item.id} item={item} fingerprint={Boolean(credential)} />
            ))}
          </ul>
        )}
      </section>

      {overview.decided.length > 0 ? (
        <section aria-labelledby="diputuskan" className="grid gap-3">
          <h2 id="diputuskan" className="flex items-center gap-2 text-base font-semibold">
            <Icon icon={SecurityCheckIcon} className="size-5" />
            Sudah diputuskan
          </h2>
          <ul aria-label="Pengajuan diputuskan" className="grid gap-2">
            {overview.decided.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 app-card p-4"
              >
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold">
                    {item.userName}, {item.kind === "masuk" ? "clock in" : "clock out"}
                  </span>
                  <span className="block text-subtle-foreground">
                    {APPROVAL_DECISION_LABEL[item.status === "ditolak" ? "ditolak" : "disetujui"]}{" "}
                    oleh {item.signerName ?? "penyetuju"}
                    {item.decidedAt ? ` pukul ${formatTimeWIB(item.decidedAt)}` : ""}
                    {item.decisionNote ? `. Catatan: ${item.decisionNote}` : ""}
                  </span>
                </span>
                {item.verifyCode ? (
                  <a
                    href={new URL(
                      verificationPath(item.verifyCode),
                      env.NEXT_PUBLIC_SITE_URL,
                    ).toString()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-50"
                  >
                    <Icon icon={SecurityCheckIcon} className="size-4" />
                    Verifikasi
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="karyawan" className="grid gap-3">
        <h2 id="karyawan" className="text-sm font-semibold">
          Karyawan
        </h2>
        {overview.employees.length === 0 ? (
          <EmptyState
            title="Belum ada karyawan yang wajib absensi"
            description="Undang karyawan dari menu Karyawan. Kehadirannya tampil di sini."
            action={
              <Link
                href="/portal/owner/karyawan"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Undang karyawan
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-(--line-strong) bg-card">
            <div
              aria-hidden="true"
              className={cn(
                "hidden items-center gap-4 border-b border-(--line-strong) bg-(--band-soft) px-4 py-2.5 text-xs font-medium text-neutral-700 lg:grid dark:text-neutral-300",
                ROW,
              )}
            >
              <span>Karyawan</span>
              <span className="text-center">Masuk</span>
              <span className="text-center">Pulang</span>
              <span className="text-center">Status</span>
            </div>
            <ul aria-label="Kehadiran karyawan" className="divide-y divide-(--line-soft)">
              {overview.employees.map((employee) => (
                <EmployeeRow key={employee.id} employee={employee} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
