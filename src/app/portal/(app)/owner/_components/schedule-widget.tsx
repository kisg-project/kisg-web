"use client";

import { useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import type { AttendanceTrendDay } from "@/features/attendance";
import { cn } from "@/lib/utils";
import { Widget, WidgetLink } from "./widget";

const asDate = (date: string) => new Date(`${date}T00:00:00Z`);
const MONTH = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
const WEEKDAY = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const WINDOW = 5;

const hhmm = (value: string) => value.slice(0, 5).replace(":", ".");

function Agenda({
  tone,
  title,
  detail,
}: {
  tone: "green" | "orange" | "violet" | "gray";
  title: string;
  detail: string;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border border-l-4 border-(--line-strong) px-3 py-2",
        tone === "green" && "border-l-success-500 bg-success-50 dark:bg-success-950",
        tone === "orange" && "border-l-warning-500 bg-warning-50 dark:bg-warning-950",
        tone === "violet" && "border-l-violet-500 bg-violet-50 dark:bg-neutral-900",
        tone === "gray" && "border-l-neutral-400 bg-neutral-50 dark:bg-neutral-900",
      )}
    >
      <span className="block text-xs font-semibold">{title}</span>
      <span className="block text-[0.6875rem] text-muted-foreground tabular-nums">{detail}</span>
    </li>
  );
}

export function ScheduleWidget({
  days,
  schedule,
}: {
  days: AttendanceTrendDay[];
  schedule: { startTime: string; endTime: string } | null;
}) {
  const [selected, setSelected] = useState(days.length - 1);
  const [end, setEnd] = useState(days.length);
  const start = Math.max(0, end - WINDOW);
  const visible = days.slice(start, end);
  const day = days[selected];
  return (
    <Widget
      id="widget-jadwal"
      title="Jadwal"
      action={<WidgetLink href="/portal/owner/jam-kerja">Jam kerja</WidgetLink>}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Hari sebelumnya"
          disabled={start === 0}
          onClick={() => {
            setEnd((value) => Math.max(WINDOW, value - 1));
          }}
          className="hit-44 flex size-8 shrink-0 items-center justify-center rounded-lg border border-(--line-strong) bg-card disabled:opacity-40"
        >
          <Icon icon={ArrowLeft01Icon} className="arrow-nudge-back size-3.5" />
        </button>
        <ul aria-label="Pilih tanggal jadwal" className="grid flex-1 grid-cols-5 gap-1">
          {visible.map((item, offset) => {
            const index = start + offset;
            const active = index === selected;
            return (
              <li key={item.date}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(index);
                  }}
                  className={cn(
                    "grid w-full justify-items-center rounded-lg border py-1.5 text-[0.625rem] leading-tight",
                    active
                      ? "border-primary-800 bg-primary-700 text-white"
                      : "border-transparent hover:border-(--line-strong) hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  )}
                >
                  <span>{WEEKDAY.format(asDate(item.date)).replace(".", "")}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {asDate(item.date).getUTCDate()}
                  </span>
                  <span className="sr-only">, {LONG.format(asDate(item.date))}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          aria-label="Hari berikutnya"
          disabled={end >= days.length}
          onClick={() => {
            setEnd((value) => Math.min(days.length, value + 1));
          }}
          className="hit-44 flex size-8 shrink-0 items-center justify-center rounded-lg border border-(--line-strong) bg-card disabled:opacity-40"
        >
          <Icon icon={ArrowRight01Icon} className="arrow-nudge size-3.5" />
        </button>
      </div>
      {day ? (
        <>
          <p className="text-xs font-medium text-muted-foreground">
            {LONG.format(asDate(day.date))}, {MONTH.format(asDate(day.date)).split(" ")[1]}
          </p>
          <ul aria-label="Agenda hari ini" className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {day.workday ? (
              <Agenda
                tone="green"
                title="Jam kerja kantor"
                detail={
                  schedule
                    ? `${hhmm(schedule.startTime)} sampai ${hhmm(schedule.endTime)} WIB`
                    : "Belum diatur"
                }
              />
            ) : (
              <Agenda tone="gray" title="Hari libur" detail="Tidak ada jam kerja kantor" />
            )}
            <Agenda
              tone="orange"
              title="Kehadiran"
              detail={`${String(day.onTime)} tepat waktu, ${String(day.late)} terlambat, ${String(day.absent)} belum absen`}
            />
            <Agenda
              tone="violet"
              title="Laporan harian"
              detail={
                day.reportsComplete === null
                  ? "Tidak ada yang hadir"
                  : `${String(day.reportsComplete)}% lengkap`
              }
            />
          </ul>
        </>
      ) : null}
    </Widget>
  );
}
