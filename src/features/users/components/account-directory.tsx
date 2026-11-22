"use client";

import { useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/state-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVITABLE_ROLES, ROLE_LABELS, type AppRole } from "@/config/roles";
import { cn } from "@/lib/utils";
import type { AccountStatus, PortalAccount } from "../queries/list";
import { AccountList } from "./account-list";

const PAGE_SIZE = 10;

const TABS: readonly { key: AccountStatus | "semua"; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "menunggu_aktivasi", label: "Menunggu aktivasi" },
  { key: "nonaktif", label: "Nonaktif" },
];

function pages(current: number, total: number): (number | "jeda")[] {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const around = [current - 1, current, current + 1].filter((page) => page > 1 && page < total);
  const list: (number | "jeda")[] = [1];
  if ((around[0] ?? total) > 2) list.push("jeda");
  list.push(...around);
  if ((around.at(-1) ?? 1) < total - 1) list.push("jeda");
  list.push(total);
  return list;
}

export function AccountDirectory({
  accounts,
  actor,
}: {
  accounts: readonly PortalAccount[];
  actor: { id: string; roles: AppRole[] };
}) {
  const [tab, setTab] = useState<AccountStatus | "semua">("semua");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<AppRole | "semua">("semua");
  const [page, setPage] = useState(1);

  const ordered = [...accounts].sort(
    (a, b) => Number(b.id === actor.id) - Number(a.id === actor.id),
  );
  const needle = query.trim().toLowerCase();
  const matching = ordered.filter(
    (account) =>
      (role === "semua" || account.roles.includes(role)) &&
      (!needle ||
        account.fullName.toLowerCase().includes(needle) ||
        account.email.toLowerCase().includes(needle)),
  );
  const shown = matching.filter((account) => tab === "semua" || account.status === tab);
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const paged = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const count = (key: AccountStatus | "semua") =>
    key === "semua" ? matching.length : matching.filter((account) => account.status === key).length;
  const reset = () => {
    setPage(1);
  };
  const squareButton =
    "hit-44 flex size-8 items-center justify-center rounded-lg border border-(--line-strong) bg-card text-xs font-medium transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-neutral-800";

  return (
    <div className="grid gap-3">
      <div
        role="group"
        aria-label="Status akun"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-(--line-strong) px-4 lg:-mx-6 lg:px-6"
      >
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTab(item.key);
                reset();
              }}
              className={cn(
                "relative -mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-xs font-medium",
                active
                  ? "border-primary-700 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.625rem] font-semibold tabular-nums",
                  active
                    ? "bg-(--band) text-foreground"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                )}
              >
                {count(item.key)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Cari karyawan</span>
          <Icon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              reset();
            }}
            placeholder="Cari nama atau email"
            className="h-10 w-full rounded-lg border border-(--line-strong) bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600 sm:h-9 sm:text-xs"
          />
        </label>
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as AppRole | "semua");
            reset();
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-lg border-(--line-strong) bg-(--band-soft) px-3 text-xs sm:h-9 sm:w-48">
            <SelectValue>{role === "semua" ? "Semua role" : ROLE_LABELS[role]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua role</SelectItem>
            {INVITABLE_ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {ROLE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paged.length === 0 ? (
        <EmptyState
          title={accounts.length === 0 ? "Belum ada karyawan" : "Tidak ada akun yang cocok"}
        />
      ) : (
        <AccountList accounts={paged} actor={actor} />
      )}

      {shown.length > 0 ? (
        <nav
          aria-label="Halaman daftar karyawan"
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <p className="text-xs text-muted-foreground tabular-nums">
            Menampilkan {(current - 1) * PAGE_SIZE + 1} sampai{" "}
            {Math.min(current * PAGE_SIZE, shown.length)} dari {shown.length} akun
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              disabled={current === 1}
              onClick={() => {
                setPage(current - 1);
              }}
              className={squareButton}
            >
              <Icon icon={ArrowLeft01Icon} className="arrow-nudge-back size-3.5" />
            </button>
            {pages(current, totalPages).map((item, index) =>
              item === "jeda" ? (
                <span
                  key={`jeda-${String(index)}`}
                  aria-hidden="true"
                  className="px-1 text-xs text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-label={`Halaman ${String(item)}`}
                  aria-current={item === current ? "page" : undefined}
                  onClick={() => {
                    setPage(item);
                  }}
                  className={cn(
                    squareButton,
                    item === current &&
                      "border-primary-800 bg-primary-700 text-white hover:bg-primary-800",
                  )}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              aria-label="Halaman berikutnya"
              disabled={current === totalPages}
              onClick={() => {
                setPage(current + 1);
              }}
              className={squareButton}
            >
              <Icon icon={ArrowRight01Icon} className="arrow-nudge size-3.5" />
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
