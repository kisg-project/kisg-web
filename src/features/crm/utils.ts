import type { LeadSummary } from "./types";

export type LeadView = "saya" | "antrean" | "semua";

export type SlaState =
  | { kind: "selesai" }
  | { kind: "tanpa" }
  | { kind: "berjalan"; minutesLeft: number; dueAt: string }
  | { kind: "lewat"; dueAt: string };

export function slaState(
  lead: Pick<LeadSummary, "slaDueAt" | "firstResponseAt" | "ownerId">,
  now: Date,
): SlaState {
  if (lead.firstResponseAt) return { kind: "selesai" };
  if (!lead.slaDueAt || !lead.ownerId) return { kind: "tanpa" };
  const left = Math.floor((new Date(lead.slaDueAt).getTime() - now.getTime()) / 60_000);
  if (left < 0) return { kind: "lewat", dueAt: lead.slaDueAt };
  return { kind: "berjalan", minutesLeft: left, dueAt: lead.slaDueAt };
}

export function leadsForView(
  leads: readonly LeadSummary[],
  view: LeadView,
  userId: string,
): LeadSummary[] {
  if (view === "saya") return leads.filter((lead) => lead.ownerId === userId);
  if (view === "antrean") return leads.filter((lead) => lead.ownerId === null);
  return [...leads];
}

export function matchesLead(lead: LeadSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const digits = needle.replace(/\D/g, "");
  return (
    lead.fullName.toLowerCase().includes(needle) ||
    (lead.projectName ?? "").toLowerCase().includes(needle) ||
    (digits.length >= 3 && lead.phone.replace(/\D/g, "").includes(digits.replace(/^0/, "")))
  );
}
