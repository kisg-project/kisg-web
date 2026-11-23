"use server";

import { CRM_MANAGER_ROLES } from "@/config/crm";
import { PRIVACY_POLICY_VERSION } from "@/config/legal";
import { ActionError, roleActionClient } from "@/lib/safe-action";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneID } from "@/lib/format";
import {
  changeStageSchema,
  createLeadSchema,
  crmSettingsSchema,
  logActivitySchema,
  reassignLeadSchema,
} from "./schemas";
import { notifyLeadEntry, notifyLeadReassigned } from "./server/notify-lead";

const crmClient = roleActionClient(["owner", "admin", "marketing_manager", "marketing"]);
const managerClient = roleActionClient(CRM_MANAGER_ROLES);

export const createLeadAction = crmClient
  .inputSchema(createLeadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const phone = normalizePhoneID(parsedInput.phone);
    if (!phone) throw new ActionError("Isi nomor HP yang valid, misal 0812...");
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .is("deleted_at", null)
      .is("merged_into_id", null)
      .maybeSingle();
    if (existing) throw new ActionError("Nomor HP ini sudah terdaftar sebagai lead.");
    const ownsLead = ctx.roles.includes("marketing");
    const { data, error } = await admin
      .from("leads")
      .insert({
        full_name: parsedInput.fullName,
        phone,
        email: parsedInput.email ?? null,
        project_id: parsedInput.projectId ?? null,
        source_kind: parsedInput.source,
        source_detail: "Input portal",
        note: parsedInput.note ?? null,
        consent_pdp_at: new Date().toISOString(),
        consent_text_version: PRIVACY_POLICY_VERSION,
        owner_id: ownsLead ? ctx.userId : null,
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505")
        throw new ActionError("Nomor HP ini sudah terdaftar sebagai lead.");
      throw new Error(`Lead gagal disimpan: ${error.message}`);
    }
    if (!ownsLead) await notifyLeadEntry(data.id);
    return { id: data.id };
  });

export const changeStageAction = crmClient
  .inputSchema(changeStageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data: before } = await ctx.supabase
      .from("leads")
      .select("stage")
      .eq("id", parsedInput.leadId)
      .maybeSingle();
    if (!before) throw new ActionError("Lead tidak ditemukan atau bukan milik Anda.");
    if (before.stage === parsedInput.stage) return { ok: true as const };
    const { data: updated, error } = await ctx.supabase
      .from("leads")
      .update({
        stage: parsedInput.stage,
        lost_reason: parsedInput.stage === "batal" ? (parsedInput.lostReason ?? null) : null,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", parsedInput.leadId)
      .select("id");
    if (error) throw new Error(`Tahap gagal disimpan: ${error.message}`);
    if (updated.length === 0) throw new ActionError("Lead tidak ditemukan atau bukan milik Anda.");
    await createSupabaseAdminClient()
      .from("lead_activities")
      .insert({
        lead_id: parsedInput.leadId,
        actor_id: ctx.userId,
        type: "perubahan_tahap",
        body: parsedInput.stage === "batal" ? (parsedInput.lostReason ?? null) : null,
        meta: { from: before.stage, to: parsedInput.stage },
      });
    return { ok: true as const };
  });

export const logActivityAction = crmClient
  .inputSchema(logActivitySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data: lead } = await ctx.supabase
      .from("leads")
      .select("id")
      .eq("id", parsedInput.leadId)
      .maybeSingle();
    if (!lead) throw new ActionError("Lead tidak ditemukan atau bukan milik Anda.");
    const { error } = await createSupabaseAdminClient().from("lead_activities").upsert(
      {
        lead_id: parsedInput.leadId,
        actor_id: ctx.userId,
        type: parsedInput.type,
        body: parsedInput.body,
        client_id: parsedInput.clientId,
      },
      { onConflict: "client_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(`Aktivitas gagal disimpan: ${error.message}`);
    return { ok: true as const };
  });

export const reassignLeadAction = managerClient
  .inputSchema(reassignLeadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const target = parsedInput.toUserId === "antrean" ? null : parsedInput.toUserId;
    const { error } = await ctx.supabase.rpc("reassign_lead", {
      p_lead: parsedInput.leadId,
      ...(target ? { p_to: target } : {}),
    });
    if (error) {
      if (error.code === "22023" || error.code === "42501") throw new ActionError(error.message);
      throw new Error(`Lead gagal dipindahkan: ${error.message}`);
    }
    if (target && target !== ctx.userId) {
      const { data: lead } = await ctx.supabase
        .from("leads")
        .select("full_name")
        .eq("id", parsedInput.leadId)
        .maybeSingle();
      await notifyLeadReassigned(parsedInput.leadId, target, lead?.full_name ?? "Lead");
    }
    return { ok: true as const };
  });

export const saveCrmSettingsAction = roleActionClient(["owner", "admin"])
  .inputSchema(crmSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await createSupabaseAdminClient()
      .from("crm_settings")
      .update({
        sla_minutes: parsedInput.slaMinutes,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      })
      .eq("id", true);
    if (error) throw new Error(`Pengaturan gagal disimpan: ${error.message}`);
    return { ok: true as const };
  });
