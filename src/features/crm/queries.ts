import "server-only";
import { DEFAULT_SLA_MINUTES } from "@/config/crm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadDetail, LeadSummary, LeadTimelineItem, MarketingChoice } from "./types";

const SUMMARY_COLUMNS =
  "id, full_name, phone, source_kind, stage, owner_id, sla_due_at, first_response_at, created_at, last_activity_at, project:projects(name)";

interface SummaryRow {
  id: string;
  full_name: string;
  phone: string;
  source_kind: LeadSummary["source"];
  stage: LeadSummary["stage"];
  owner_id: string | null;
  sla_due_at: string | null;
  first_response_at: string | null;
  created_at: string;
  last_activity_at: string;
  project: { name: string } | null;
}

async function namesOf(ids: readonly (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const { data } = await createSupabaseAdminClient()
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);
  return new Map((data ?? []).map((row) => [row.id, row.full_name || "Tanpa nama"]));
}

function toSummary(row: SummaryRow, names: Map<string, string>): LeadSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    projectName: row.project?.name ?? null,
    source: row.source_kind,
    stage: row.stage,
    ownerId: row.owner_id,
    ownerName: row.owner_id ? (names.get(row.owner_id) ?? null) : null,
    slaDueAt: row.sla_due_at,
    firstResponseAt: row.first_response_at,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}

export async function listLeads(limit = 300): Promise<LeadSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select(SUMMARY_COLUMNS)
    .is("merged_into_id", null)
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<SummaryRow[], { merge: false }>();
  if (error) throw new Error(`Lead gagal dimuat: ${error.message}`);
  const names = await namesOf(data.map((row) => row.owner_id));
  return data.map((row) => toSummary(row, names));
}

interface DetailRow extends SummaryRow {
  email: string | null;
  source_detail: string | null;
  note: string | null;
  lost_reason: string | null;
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("leads")
    .select(`${SUMMARY_COLUMNS}, email, source_detail, note, lost_reason`)
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<DetailRow, { merge: false }>();
  if (error) throw new Error(`Lead gagal dimuat: ${error.message}`);
  if (!row) return null;

  const [{ data: activities }, { data: assignments }] = await Promise.all([
    supabase
      .from("lead_activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("lead_id", id)
      .order("occurred_at", { ascending: false })
      .limit(100),
    supabase
      .from("lead_assignments")
      .select("id, reason, created_at, actor_id, to_user_id")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const names = await namesOf([
    row.owner_id,
    ...(activities ?? []).map((item) => item.actor_id),
    ...(assignments ?? []).flatMap((item) => [item.actor_id, item.to_user_id]),
  ]);
  const nameOf = (userId: string | null) => (userId ? (names.get(userId) ?? null) : null);

  const timeline: LeadTimelineItem[] = [
    ...(activities ?? []).map((item) => ({
      id: item.id,
      at: item.occurred_at,
      actorName: nameOf(item.actor_id),
      kind: "aktivitas" as const,
      activityType: item.type,
      body: item.body,
    })),
    ...(assignments ?? []).map((item) => ({
      id: item.id,
      at: item.created_at,
      actorName: nameOf(item.actor_id),
      kind: "pembagian" as const,
      reason: item.reason,
      toName: nameOf(item.to_user_id),
      body: null,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    ...toSummary(row, names),
    email: row.email,
    sourceDetail: row.source_detail,
    note: row.note,
    lostReason: row.lost_reason,
    timeline,
  };
}

export async function listAssignableMarketing(): Promise<MarketingChoice[]> {
  const admin = createSupabaseAdminClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("user_id")
    .in("role", ["marketing", "marketing_manager"]);
  const ids = [...new Set((roles ?? []).map((row) => row.user_id))];
  if (ids.length === 0) return [];
  const { data: people } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);
  return (people ?? [])
    .map((person) => ({ id: person.id, name: person.full_name || "Tanpa nama" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSlaMinutes(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("crm_settings").select("sla_minutes").maybeSingle();
  return data?.sla_minutes ?? DEFAULT_SLA_MINUTES;
}
