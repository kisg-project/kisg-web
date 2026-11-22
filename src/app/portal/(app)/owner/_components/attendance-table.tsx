"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Avatar } from "@/components/shared/avatar";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/state-message";
import { cn } from "@/lib/utils";
import { Pill, Widget, WidgetLink } from "./widget";

export interface AttendanceRow {
  id: string;
  name: string;
  location: string | null;
  present: boolean;
  late: number;
  outside: boolean;
  rencana: boolean;
  hasil: boolean;
}

const COLUMNS = "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_7.5rem_3rem]";

function Progress({ row }: { row: AttendanceRow }) {
  const done = Number(row.rencana) + Number(row.hasil);
  const percent = row.present ? done * 50 : 0;
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="grid flex-1 grid-cols-2 gap-1">
        {[row.rencana, row.hasil].map((filled, index) => (
          <span
            key={String(index)}
            className={cn(
              "h-1.5 rounded-full",
              filled
                ? done === 2
                  ? "bg-success-400"
                  : "bg-warning-400"
                : "bg-neutral-200 dark:bg-neutral-700",
            )}
          />
        ))}
      </span>
      <span className="w-9 text-right text-[0.6875rem] text-muted-foreground tabular-nums">
        {percent}%
      </span>
    </span>
  );
}

function Status({ row }: { row: AttendanceRow }) {
  if (!row.present) return <Pill tone="gray">Belum absen</Pill>;
  if (row.outside) return <Pill tone="blue">Di luar lokasi</Pill>;
  if (row.late > 0) return <Pill tone="orange">Terlambat</Pill>;
  return <Pill tone="green">Tepat waktu</Pill>;
}

export function AttendanceTable({
  rows,
  className,
}: {
  rows: AttendanceRow[];
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const shown = rows
    .filter((row) => row.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);
  return (
    <Widget
      id="widget-tabel-kehadiran"
      title="Kehadiran karyawan"
      className={className}
      action={
        <div className="flex items-center gap-2">
          <label className="relative hidden sm:block">
            <span className="sr-only">Cari karyawan</span>
            <Icon
              icon={Search01Icon}
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Cari karyawan"
              className="h-8 w-44 rounded-lg border border-(--line-strong) bg-card pr-2.5 pl-8 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            />
          </label>
          <WidgetLink href="/portal/owner/absensi">Lihat semua</WidgetLink>
        </div>
      }
    >
      <label className="relative sm:hidden">
        <span className="sr-only">Cari karyawan</span>
        <Icon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Cari karyawan"
          className="h-10 w-full rounded-lg border border-(--line-strong) bg-card pr-2.5 pl-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        />
      </label>
      {shown.length === 0 ? (
        <EmptyState
          title={
            rows.length === 0 ? "Belum ada karyawan wajib absensi" : "Karyawan tidak ditemukan"
          }
          className="py-4"
        />
      ) : (
        <div className="-mx-4 -mb-4 overflow-hidden border-t border-(--line-strong)">
          <div
            aria-hidden="true"
            className={cn(
              "hidden items-center gap-4 border-b border-(--line-strong) bg-(--band-soft) px-4 py-2 text-xs font-medium text-neutral-700 lg:grid dark:text-neutral-300",
              COLUMNS,
            )}
          >
            <span>Karyawan</span>
            <span>Lokasi</span>
            <span>Laporan</span>
            <span className="text-center">Status</span>
            <span className="text-right">Aksi</span>
          </div>
          <ul aria-label="Tabel kehadiran hari ini" className="divide-y divide-(--line-soft)">
            {shown.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:gap-4",
                  COLUMNS,
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar src={null} name={row.name} className="size-8 text-[0.6875rem]" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] font-semibold">
                      {row.name}
                    </span>
                    <span className="block truncate text-[0.6875rem] text-muted-foreground lg:hidden">
                      {row.location ?? "Belum ada lokasi"}
                    </span>
                  </span>
                </span>
                <span className="hidden truncate text-xs lg:block">{row.location ?? "-"}</span>
                <span className="col-span-2 lg:col-span-1">
                  <Progress row={row} />
                </span>
                <span className="col-start-2 row-start-1 justify-self-end lg:col-start-auto lg:row-start-auto lg:justify-self-center">
                  <Status row={row} />
                </span>
                <Link
                  href="/portal/owner/absensi"
                  aria-label={`Detail kehadiran ${row.name}`}
                  title="Detail"
                  className="hit-44 hidden size-8 items-center justify-center justify-self-end rounded-lg border border-(--line-strong) bg-card hover:bg-neutral-50 lg:flex dark:hover:bg-neutral-800"
                >
                  <Icon icon={ArrowUpRight01Icon} className="arrow-nudge-up size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Widget>
  );
}
