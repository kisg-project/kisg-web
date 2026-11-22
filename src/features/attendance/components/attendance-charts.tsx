"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AttendanceTrendDay } from "../queries/attendance";

const DAY = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", timeZone: "UTC" });
const FULL_DAY = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function dayLabel(date: string): string {
  return DAY.format(new Date(`${date}T00:00:00Z`));
}
function fullDay(date: string): string {
  return FULL_DAY.format(new Date(`${date}T00:00:00Z`));
}

const SERIES = [
  { key: "onTime", label: "Tepat waktu", color: "var(--chart-on-time)" },
  { key: "late", label: "Terlambat", color: "var(--chart-late)" },
  { key: "absent", label: "Belum absen", color: "var(--chart-absent)" },
] as const;

const AXIS = { fontSize: 12, fill: "var(--muted-foreground)" };

function TooltipCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color: string; line?: boolean }[];
}) {
  return (
    <div className="grid min-w-44 gap-1.5 rounded-2xl border bg-popover px-3.5 py-3 text-sm shadow-lg">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn("shrink-0 rounded-full", row.line ? "h-0.5 w-3" : "size-2.5")}
            style={{ backgroundColor: row.color }}
          />
          <span className="font-bold tabular">{row.value}</span>
          <span className="text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  );
}

function AttendanceTooltip({
  active,
  payload,
}: TooltipContentProps<TooltipValueType, string | number>) {
  const day = payload[0]?.payload as AttendanceTrendDay | undefined;
  if (!active || !day) return null;
  return (
    <TooltipCard
      title={`${fullDay(day.date)}${day.workday ? "" : ", hari libur"}`}
      rows={[...SERIES].reverse().map((item) => ({
        label: item.label,
        value: `${String(day[item.key])} orang`,
        color: item.color,
      }))}
    />
  );
}

function ReportTooltip({
  active,
  payload,
}: TooltipContentProps<TooltipValueType, string | number>) {
  const day = payload[0]?.payload as AttendanceTrendDay | undefined;
  if (!active || !day) return null;
  return (
    <TooltipCard
      title={fullDay(day.date)}
      rows={[
        {
          label: "laporan lengkap",
          value:
            day.reportsComplete === null
              ? "Tidak ada yang hadir"
              : `${String(day.reportsComplete)}%`,
          color: "var(--chart-trend)",
          line: true,
        },
      ]}
    />
  );
}

/** Kartu grafik: judul, ringkasan angka, grafik, dan tabel data yang bisa dibuka (tanpa hover). */
function ChartCard({
  title,
  summary,
  legend,
  description,
  table,
  children,
  className,
}: {
  className?: string;
  title: string;
  summary: string;
  legend?: ReactNode;
  description: string;
  table: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const [showTable, setShowTable] = useState(false);
  return (
    <section
      aria-labelledby={`${id}-judul`}
      className={cn("grid min-w-0 content-start gap-4 app-card p-5 sm:p-6", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`${id}-judul`} className="text-base font-bold">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
        <button
          type="button"
          aria-expanded={showTable}
          aria-controls={`${id}-tabel`}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-50"
          onClick={() => {
            setShowTable((value) => !value);
          }}
        >
          {showTable ? "Lihat grafik" : "Lihat tabel"}
        </button>
      </div>
      {legend}
      {showTable ? (
        <div id={`${id}-tabel`} className="max-h-72 overflow-auto rounded-2xl border">
          {table}
        </div>
      ) : (
        <div className="h-60 w-full min-w-0 overflow-hidden sm:h-64">
          <p className="sr-only">{description}</p>
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * Grafik dashboard owner: komposisi kehadiran harian (batang bertumpuk) dan persentase laporan harian
 * lengkap (area satu seri). Warna dari token --chart-* yang lolos validator palet (terang dan gelap),
 * celah 2 px berwarna permukaan antar segmen, tooltip per hari, dan tabel data sebagai alternatif.
 */
export function AttendanceCharts({ days }: { days: AttendanceTrendDay[] }) {
  const today = days.at(-1);
  // Hari libur tidak punya "belum absen", jadi yang tetap masuk di hari libur ikut dihitung hadir.
  const present = days.reduce((sum, day) => sum + day.onTime + day.late, 0);
  const expected = days.reduce((sum, day) => sum + day.onTime + day.late + day.absent, 0);
  const late = days.reduce((sum, day) => sum + day.late, 0);
  const reportDays = days.filter((day) => day.reportsComplete !== null);
  const reportAverage =
    reportDays.length > 0
      ? Math.round(
          reportDays.reduce((sum, day) => sum + (day.reportsComplete ?? 0), 0) / reportDays.length,
        )
      : null;
  const rate = expected > 0 ? Math.round((present / expected) * 100) : null;
  const tableClass = "w-full text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2";

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <ChartCard
        className="xl:col-span-3"
        title="Kehadiran harian"
        summary={
          rate === null
            ? "Belum ada data kehadiran."
            : `Tingkat hadir ${String(rate)}%, ${String(late)} kali terlambat.`
        }
        description={`Grafik batang kehadiran harian. Hari ini ${String(today?.onTime ?? 0)} tepat waktu, ${String(today?.late ?? 0)} terlambat, ${String(today?.absent ?? 0)} belum absen.`}
        legend={
          <ul aria-label="Keterangan warna" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {SERIES.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        }
        table={
          <table className={tableClass}>
            <thead className="sticky top-0 bg-surface text-left">
              <tr>
                <th scope="col">Tanggal</th>
                {SERIES.map((item) => (
                  <th key={item.key} scope="col" className="text-right">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={days}
            margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
            barCategoryGap="22%"
          >
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              tickFormatter={dayLabel}
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              content={AttendanceTooltip}
              cursor={{ fill: "var(--chart-grid)", opacity: 0.6 }}
              isAnimationActive={false}
            />
            {SERIES.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                stackId="hadir"
                fill={item.color}
                stroke="var(--card)"
                strokeWidth={2}
                maxBarSize={24}
                radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                animationDuration={700}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        className="xl:col-span-2"
        title="Laporan harian lengkap"
        summary={
          reportAverage === null
            ? "Belum ada laporan harian."
            : `Rata-rata ${String(reportAverage)}% karyawan hadir mengisi rencana dan hasil kerja.`
        }
        description={`Grafik area persentase karyawan hadir yang mengisi rencana dan hasil kerja. Rata-rata ${String(reportAverage ?? 0)}%.`}
        table={
          <table className={tableClass}>
            <thead className="sticky top-0 bg-surface text-left">
              <tr>
                <th scope="col">Tanggal</th>
                <th scope="col" className="text-right">
                  Laporan lengkap
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="laporan-isi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-trend)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--chart-trend)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              tickFormatter={dayLabel}
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(value: number) => `${String(value)}%`}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={ReportTooltip}
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="reportsComplete"
              name="Laporan lengkap"
              stroke="var(--chart-trend)"
              strokeWidth={2}
              fill="url(#laporan-isi)"
              connectNulls={false}
              dot={{ r: 4, fill: "var(--chart-trend)", stroke: "var(--card)", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "var(--chart-trend)",
                stroke: "var(--card)",
                strokeWidth: 2,
              }}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
