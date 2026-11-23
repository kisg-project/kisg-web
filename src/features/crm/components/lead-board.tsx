"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight01Icon, Search01Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/state-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_SOURCE_LABEL,
  LEAD_STAGE_LABEL,
  LEAD_STAGE_TONE,
  LEAD_STAGES,
  type LeadStage,
} from "@/config/crm";
import { formatPhoneDisplay, formatTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeadSummary } from "../types";
import { leadsForView, matchesLead, slaState, type LeadView } from "../utils";

const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, TICK_MS);
  return () => {
    window.clearInterval(timer);
  };
}

function useMinute(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / TICK_MS) * TICK_MS,
    () => 0,
  );
}

export function StageBadge({ stage }: { stage: LeadStage }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
        LEAD_STAGE_TONE[stage],
      )}
    >
      {LEAD_STAGE_LABEL[stage]}
    </span>
  );
}

export function SlaChip({ lead }: { lead: LeadSummary }) {
  const now = useMinute();
  if (now === 0) return null;
  const state = slaState(lead, new Date(now));
  if (state.kind === "lewat") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-danger-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-danger-700">
        Lewat batas respons
      </span>
    );
  }
  if (state.kind === "berjalan") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-warning-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-warning-800 tabular-nums">
        Respons sebelum {formatTimeWIB(state.dueAt)}
      </span>
    );
  }
  return null;
}

function LeadRow({ lead, showOwner }: { lead: LeadSummary; showOwner: boolean }) {
  return (
    <li aria-label={lead.fullName}>
      <Link
        href={`/portal/crm/${lead.id}`}
        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-(--band-soft)"
      >
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 truncate text-[0.8125rem] font-semibold">{lead.fullName}</span>
            <StageBadge stage={lead.stage} />
            <SlaChip lead={lead} />
          </span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {formatPhoneDisplay(lead.phone)}
            {lead.projectName ? `, ${lead.projectName}` : ""}
          </span>
          <span className="text-[0.6875rem] text-muted-foreground">
            {LEAD_SOURCE_LABEL[lead.source]}
            {showOwner ? `, ${lead.ownerName ?? "Antrean manajer"}` : ""}
          </span>
        </span>
        <Icon
          icon={ArrowRight01Icon}
          size={16}
          className="arrow-nudge mt-1 text-muted-foreground"
        />
      </Link>
    </li>
  );
}

export function LeadBoard({
  leads,
  userId,
  manager,
}: {
  leads: readonly LeadSummary[];
  userId: string;
  manager: boolean;
}) {
  const tabs: { key: LeadView; label: string }[] = manager
    ? [
        { key: "antrean", label: "Antrean" },
        { key: "saya", label: "Lead saya" },
        { key: "semua", label: "Semua lead" },
      ]
    : [{ key: "saya", label: "Lead saya" }];
  const [view, setView] = useState<LeadView>(manager ? "antrean" : "saya");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LeadStage | "semua">("semua");

  const filtered = (key: LeadView) =>
    leadsForView(leads, key, userId).filter(
      (lead) => (stage === "semua" || lead.stage === stage) && matchesLead(lead, query),
    );
  const shown = filtered(view);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      {tabs.length > 1 ? (
        <div
          role="group"
          aria-label="Kelompok lead"
          className="-mx-4 flex gap-1 overflow-x-auto border-b border-(--line-strong) px-4 lg:-mx-6 lg:px-6"
        >
          {tabs.map((item) => {
            const active = item.key === view;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setView(item.key);
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
                  {filtered(item.key).length}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Cari lead</span>
          <Icon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Cari nama, nomor HP, atau proyek"
            className="h-10 w-full rounded-lg border border-(--line-strong) bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-600 sm:h-9 sm:text-xs"
          />
        </label>
        <label htmlFor="filter-tahap" className="sr-only">
          Filter tahap
        </label>
        <Select
          value={stage}
          onValueChange={(value) => {
            setStage(value as LeadStage | "semua");
          }}
        >
          <SelectTrigger
            id="filter-tahap"
            className="h-10 w-full rounded-lg border-(--line-strong) bg-(--band-soft) px-3 text-xs sm:h-9 sm:w-48"
          >
            <SelectValue>{stage === "semua" ? "Semua tahap" : LEAD_STAGE_LABEL[stage]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua tahap</SelectItem>
            {LEAD_STAGES.map((item) => (
              <SelectItem key={item} value={item}>
                {LEAD_STAGE_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shown.length > 0 ? (
        <ul
          aria-label="Daftar lead"
          className="divide-y divide-(--line-strong) overflow-hidden rounded-xl border border-(--line-strong) bg-card"
        >
          {shown.map((lead) => (
            <LeadRow key={lead.id} lead={lead} showOwner={manager} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={UserMultiple02Icon}
          title={view === "antrean" ? "Antrean kosong" : "Belum ada lead"}
          description={
            query || stage !== "semua"
              ? "Tidak ada lead yang cocok dengan pencarian."
              : view === "antrean"
                ? "Lead yang belum punya marketing muncul di sini."
                : "Lead baru dari website, iklan, dan chat dibagikan ke sini."
          }
        />
      )}
    </div>
  );
}
