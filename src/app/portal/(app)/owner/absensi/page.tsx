import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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

function Chip({ tone, children }: { tone: "warning" | "primary" | "muted"; children: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "warning" && "bg-warning-100 text-warning-800",
        tone === "primary" && "bg-primary-50 text-primary-800",
        tone === "muted" && "bg-surface text-subtle-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Selfie({ src, label }: { src: string | null; label: string }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed URL privat berumur pendek, tidak lewat optimasi gambar
    <img src={src} alt={label} className="size-16 shrink-0 rounded-2xl object-cover" />
  );
}

function ReportBlock({
  title,
  icon: Icon,
  report,
}: {
  title: string;
  icon: typeof ClipboardList;
  report: OverviewEmployee["rencana"];
}) {
  if (!report) {
    return (
      <p className="flex items-center gap-2 text-sm text-subtle-foreground">
        <Icon aria-hidden="true" className="size-4" />
        {title}: belum diisi
      </p>
    );
  }
  return (
    <details className="group rounded-2xl bg-surface p-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4 text-primary" />
        {title}
        <span className="font-normal text-subtle-foreground tabular">
          {formatTimeWIB(report.updatedAt)}
        </span>
      </summary>
      <p className="mt-2 text-sm whitespace-pre-line">{report.content}</p>
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
                  <FileText aria-hidden="true" className="size-4" />
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

function EmployeeCard({ employee }: { employee: OverviewEmployee }) {
  const day = employee.day;
  return (
    <li className="grid gap-3 app-card p-4">
      <div className="flex items-start gap-3">
        <Selfie src={day?.selfieIn ?? null} label={`Foto clock in ${employee.name}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{employee.name}</p>
          {day ? (
            <p className="text-sm text-subtle-foreground tabular">
              {formatTimeWIB(day.clockInAt)} sampai{" "}
              {day.clockOutAt ? formatTimeWIB(day.clockOutAt) : "belum clock out"}
              {day.clockInLocation ? `, ${day.clockInLocation}` : ""}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {!day ? <Chip tone="muted">Belum absen</Chip> : null}
            {day && day.lateMinutes > 0 ? (
              <Chip tone="warning">{`Terlambat ${String(day.lateMinutes)} menit`}</Chip>
            ) : null}
            {day && day.earlyMinutes > 0 ? (
              <Chip tone="warning">{`Pulang awal ${String(day.earlyMinutes)} menit`}</Chip>
            ) : null}
            {day?.outside ? <Chip tone="primary">Di luar lokasi</Chip> : null}
            {day?.movedLocation ? <Chip tone="primary">Pindah lokasi</Chip> : null}
          </div>
        </div>
      </div>
      {day ? (
        <div className="grid gap-2">
          <ReportBlock title="Rencana kegiatan" icon={ClipboardList} report={employee.rencana} />
          <ReportBlock title="Hasil kerja" icon={ClipboardCheck} report={employee.hasil} />
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

function PendingCard({ item }: { item: OverviewException }) {
  return (
    <li className="grid gap-4 app-card p-4">
      <div className="flex items-start gap-3">
        <Selfie src={item.photoUrl} label={`Foto pengajuan ${item.userName}`} />
        <div className="grid min-w-0 flex-1 gap-0.5 text-sm">
          <ExceptionSummary item={item} />
        </div>
      </div>
      <ExceptionDecision id={item.id} summary={<ExceptionSummary item={item} />} />
    </li>
  );
}

/**
 * Kehadiran harian untuk owner: ringkasan, pengajuan di luar lokasi yang menunggu persetujuan digital,
 * keputusan di tanggal itu dengan tautan verifikasi, dan status setiap karyawan beserta laporannya.
 */
export default async function OwnerAttendancePage({
  searchParams,
}: PageProps<"/portal/owner/absensi">) {
  await requirePortalUser(["owner", "admin"]);
  const today = todayWib();
  const date = pickDate((await searchParams).tanggal, today);
  const overview = await getAttendanceOverview(date);
  const { summary } = overview;
  const stats = [
    { label: "Wajib absen", value: summary.total },
    { label: "Hadir", value: summary.present },
    { label: "Terlambat", value: summary.late },
    { label: "Belum absen", value: summary.absent },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke dashboard"
        title="Kehadiran"
        description={formatDateWIB(date)}
      />

      <nav aria-label="Pilih tanggal" className="flex items-center gap-2">
        <Link
          href={`${BASE}?tanggal=${shiftDate(date, -1)}`}
          aria-label="Hari sebelumnya"
          className="inline-flex size-11 items-center justify-center rounded-full border bg-background hover:bg-accent"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        {date < today ? (
          <Link
            href={`${BASE}?tanggal=${shiftDate(date, 1)}`}
            aria-label="Hari berikutnya"
            className="inline-flex size-11 items-center justify-center rounded-full border bg-background hover:bg-accent"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Link>
        ) : null}
        {date !== today ? (
          <Link
            href={BASE}
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-primary hover:bg-primary-50"
          >
            Hari ini
          </Link>
        ) : null}
      </nav>

      <dl aria-label="Ringkasan kehadiran" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="app-card p-4">
            <dt className="text-sm text-subtle-foreground">{item.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="menunggu" className="grid gap-3">
        <h2 id="menunggu" className="flex items-center gap-2 text-lg font-bold">
          <MapPin aria-hidden="true" className="size-5" />
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
              <PendingCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      {overview.decided.length > 0 ? (
        <section aria-labelledby="diputuskan" className="grid gap-3">
          <h2 id="diputuskan" className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck aria-hidden="true" className="size-5" />
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
                    <ShieldCheck aria-hidden="true" className="size-4" />
                    Verifikasi
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="karyawan" className="grid gap-3">
        <h2 id="karyawan" className="text-lg font-bold">
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
          <ul aria-label="Kehadiran karyawan" className="grid gap-3 lg:grid-cols-2">
            {overview.employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
