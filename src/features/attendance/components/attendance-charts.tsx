"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AttendanceTrendDay } from "../queries/attendance";

const WEEKDAY = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" });
const FULL_DAY = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const asDate = (date: string) => new Date(`${date}T00:00:00Z`);
const fullDay = (date: string) => FULL_DAY.format(asDate(date));
const dayNumber = (date: string) => String(asDate(date).getUTCDate());
const weekday = (date: string) => WEEKDAY.format(asDate(date)).replace(".", "").slice(0, 3);

const SERIES = [
  {
    key: "onTime",
    label: "Tepat waktu",
    cell: "bg-success-400 border-success-800",
  },
  {
    key: "late",
    label: "Terlambat",
    cell: "bg-warning-400 border-warning-800 bg-[repeating-linear-gradient(135deg,transparent_0_3px,rgb(255_255_255/0.45)_3px_5px)]",
  },
  {
    key: "absent",
    label: "Belum absen",
    cell: "bg-card border-neutral-400 dark:border-neutral-600",
  },
] as const;

const MAX_ROWS = 10;

const REPORT_STEPS = [
  { min: 100, cell: "bg-success-400" },
  { min: 75, cell: "bg-success-300" },
  { min: 50, cell: "bg-success-200" },
  { min: 25, cell: "bg-success-100" },
  { min: 0, cell: "bg-success-50" },
] as const;

const reportCell = (value: number) =>
  REPORT_STEPS.find((step) => value >= step.min)?.cell ?? "bg-success-50";

function ChartCard({
  title,
  summary,
  legend,
  table,
  children,
  className,
}: {
  title: string;
  summary: string;
  legend?: ReactNode;
  table: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [showTable, setShowTable] = useState(false);
  return (
    <section
      aria-labelledby={`${id}-judul`}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border border-(--line-strong) bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${id}-judul`} className="text-sm font-semibold">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
        <button
          type="button"
          aria-expanded={showTable}
          aria-controls={`${id}-tabel`}
          className="hit-44 inline-flex h-9 shrink-0 items-center rounded-lg border border-(--line-strong) bg-card px-3 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
          onClick={() => {
            setShowTable((value) => !value);
          }}
        >
          {showTable ? "Lihat grafik" : "Lihat tabel"}
        </button>
      </div>
      {legend}
      {showTable ? (
        <div
          id={`${id}-tabel`}
          className="max-h-72 overflow-auto rounded-lg border border-(--line-soft)"
        >
          {table}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function Legend({ items }: { items: readonly { label: string; cell: string }[] }) {
  return (
    <ul aria-label="Keterangan warna" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
          <span aria-hidden="true" className={cn("size-3 rounded-[3px] border", item.cell)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function Tip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-lg border border-(--line-strong) bg-popover px-2.5 py-2 text-left text-[0.6875rem] shadow-md group-hover:block group-focus-visible:block"
    >
      <span className="block font-semibold">{title}</span>
      {lines.map((line) => (
        <span key={line} className="block text-muted-foreground tabular-nums">
          {line}
        </span>
      ))}
    </span>
  );
}

function DayLabel({ date, today }: { date: string; today: boolean }) {
  return (
    <span
      className={cn(
        "grid justify-items-center text-[0.625rem] leading-tight",
        today ? "font-semibold text-foreground" : "text-muted-foreground",
      )}
    >
      <span className="tabular-nums">{dayNumber(date)}</span>
      <span>{weekday(date)}</span>
    </span>
  );
}

function AttendanceWaffle({ days }: { days: AttendanceTrendDay[] }) {
  const largest = Math.max(1, ...days.map((day) => day.onTime + day.late + day.absent));
  const unit = Math.max(1, Math.ceil(largest / MAX_ROWS));
  const last = days.at(-1)?.date;
  return (
    <div className="grid gap-2">
      <div
        className="grid items-end gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${String(days.length)}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const cells = SERIES.flatMap((item) =>
            Array.from({ length: Math.round(day[item.key] / unit) }, () => item),
          );
          const label = `${fullDay(day.date)}${day.workday ? "" : ", libur"}`;
          const lines = day.workday
            ? SERIES.map((item) => `${String(day[item.key])} ${item.label.toLowerCase()}`)
            : ["Hari libur"];
          return (
            <div
              key={day.date}
              tabIndex={0}
              aria-label={`${label}: ${lines.join(", ")}`}
              className="group relative flex h-full flex-col items-center gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <Tip title={label} lines={lines} />
              <div className="flex w-full max-w-7 flex-1 flex-col-reverse justify-start gap-[3px] pt-1">
                {cells.length === 0 ? (
                  <span
                    aria-hidden="true"
                    className="aspect-square w-full rounded-[4px] border border-dashed border-neutral-300 dark:border-neutral-700"
                  />
                ) : (
                  cells.map((item, index) => (
                    <span
                      key={`${item.key}-${String(index)}`}
                      aria-hidden="true"
                      className={cn(
                        "aspect-square w-full rounded-[4px] border transition-transform group-hover:scale-105",
                        item.cell,
                      )}
                    />
                  ))
                )}
              </div>
              <DayLabel date={day.date} today={day.date === last} />
            </div>
          );
        })}
      </div>
      {unit > 1 ? (
        <p className="text-[0.6875rem] text-muted-foreground">1 kotak = {unit} karyawan</p>
      ) : null}
    </div>
  );
}

function ReportRing({ value }: { value: number | null }) {
  const radius = 42;
  const length = 2 * Math.PI * radius;
  const filled = value === null ? 0 : (value / 100) * length;
  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none stroke-success-50 dark:stroke-neutral-800"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="fill-none stroke-success-400"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${String(filled)} ${String(length)}`}
        />
      </svg>
      <span className="grid justify-items-center">
        <span className="text-xl font-semibold tabular-nums">
          {value === null ? "-" : `${String(value)}%`}
        </span>
        <span className="text-[0.625rem] text-muted-foreground">rata-rata</span>
      </span>
    </div>
  );
}

function ReportTiles({ days }: { days: AttendanceTrendDay[] }) {
  const last = days.at(-1)?.date;
  return (
    <ul aria-label="Laporan lengkap per hari" className="grid flex-1 grid-cols-7 gap-1.5">
      {days.map((day) => {
        const value = day.reportsComplete;
        const label = fullDay(day.date);
        const text = value === null ? "Tidak ada yang hadir" : `${String(value)}% laporan lengkap`;
        return (
          <li
            key={day.date}
            tabIndex={0}
            aria-label={`${label}: ${text}`}
            className="group relative grid justify-items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <Tip title={label} lines={[text]} />
            <span
              aria-hidden="true"
              className={cn(
                "grid aspect-square w-full max-w-9 place-items-center rounded-md border text-[0.625rem] font-semibold text-neutral-900 tabular-nums",
                value === null
                  ? "border-dashed border-neutral-300 bg-card text-muted-foreground dark:border-neutral-700"
                  : cn("border-success-800/40", reportCell(value)),
              )}
            >
              {value === null ? "-" : value}
            </span>
            <DayLabel date={day.date} today={day.date === last} />
          </li>
        );
      })}
    </ul>
  );
}

const TABLE = "w-full text-xs [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2";

export function AttendanceTrendCard({
  days,
  className,
}: {
  days: AttendanceTrendDay[];
  className?: string;
}) {
  const present = days.reduce((sum, day) => sum + day.onTime + day.late, 0);
  const expected = days.reduce((sum, day) => sum + day.onTime + day.late + day.absent, 0);
  const late = days.reduce((sum, day) => sum + day.late, 0);
  const rate = expected > 0 ? Math.round((present / expected) * 100) : null;
  return (
    <ChartCard
      className={className}
      title="Kehadiran harian"
      summary={
        rate === null
          ? "Belum ada data kehadiran."
          : `Tingkat hadir ${String(rate)}%, ${String(late)} kali terlambat.`
      }
      legend={<Legend items={SERIES} />}
      table={
        <table className={TABLE}>
          <thead className="sticky top-0 bg-(--band-soft,var(--color-neutral-100)) text-left">
            <tr>
              <th scope="col">Tanggal</th>
              {SERIES.map((item) => (
                <th key={item.key} scope="col" className="text-right">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line-soft)">
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row" className="text-left font-normal">
                  {fullDay(day.date)}
                  {day.workday ? "" : " (libur)"}
                </th>
                {SERIES.map((item) => (
                  <td key={item.key} className="text-right tabular-nums">
                    {day[item.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <AttendanceWaffle days={days} />
    </ChartCard>
  );
}

export function ReportTrendCard({
  days,
  className,
}: {
  days: AttendanceTrendDay[];
  className?: string;
}) {
  const reportDays = days.filter((day) => day.reportsComplete !== null);
  const reportAverage =
    reportDays.length > 0
      ? Math.round(
          reportDays.reduce((sum, day) => sum + (day.reportsComplete ?? 0), 0) / reportDays.length,
        )
      : null;
  return (
    <ChartCard
      className={className}
      title="Laporan harian lengkap"
      summary={
        reportAverage === null
          ? "Belum ada laporan harian."
          : "Karyawan hadir yang mengisi rencana dan hasil kerja."
      }
      legend={
        <Legend
          items={[
            { label: "Sedikit", cell: "bg-success-50 border-success-800/40" },
            { label: "Sebagian", cell: "bg-success-200 border-success-800/40" },
            { label: "Semua", cell: "bg-success-400 border-success-800/40" },
          ]}
        />
      }
      table={
        <table className={TABLE}>
          <thead className="sticky top-0 bg-(--band-soft,var(--color-neutral-100)) text-left">
            <tr>
              <th scope="col">Tanggal</th>
              <th scope="col" className="text-right">
                Laporan lengkap
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line-soft)">
            {days.map((day) => (
              <tr key={day.date}>
                <th scope="row" className="text-left font-normal">
                  {fullDay(day.date)}
                </th>
                <td className="text-right tabular-nums">
                  {day.reportsComplete === null
                    ? "Tidak ada yang hadir"
                    : `${String(day.reportsComplete)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <ReportRing value={reportAverage} />
        <ReportTiles days={days} />
      </div>
    </ChartCard>
  );
}
