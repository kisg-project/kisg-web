"use server";

import { headers } from "next/headers";
import { brochureFor } from "@/config/brochures";
import { PRIVACY_POLICY_VERSION } from "@/config/legal";
import { notifyLeadEntry } from "@/features/crm/server";
import { ActionError, actionClient } from "@/lib/safe-action";
import { clientIp, hashKey, hitRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneID } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";
import { leadFormSchema } from "../schemas/lead";

type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
type FormKind = Database["public"]["Enums"]["form_kind"];

const SOURCE_DETAIL: Record<FormKind, string> = {
  minat: "Form minat website",
  kontak: "Form kontak website",
  brosur: "Form minta brosur website",
  landing_page: "Form landing page",
  karir: "Form lamaran",
  chat: "Chat website",
};

async function recordSubmission(input: {
  formKind: FormKind;
  status: SubmissionStatus;
  pagePath: string | undefined;
  ipHash: string;
  leadId?: string;
  payload?: Record<string, unknown>;
}) {
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await createSupabaseAdminClient()
    .from("form_submissions")
    .insert({
      form_kind: input.formKind,
      status: input.status,
      page_path: input.pagePath ?? null,
      ip_hash: input.ipHash,
      user_agent: userAgent,
      lead_id: input.leadId ?? null,
      payload: (input.payload ??
        {}) as Database["public"]["Tables"]["form_submissions"]["Insert"]["payload"],
    });
}

/**
 * Form lead publik (minat, kontak, brosur). Urutan pengaman: preview, honeypot, rate limit IP dan
 * nomor HP, Turnstile, lalu upsert_lead (nomor yang sama digabung ke lead lama). Setiap kiriman,
 * diterima atau ditolak, dicatat di form_submissions tanpa data sensitif.
 */
export const submitLeadAction = actionClient
  .inputSchema(leadFormSchema)
  .action(async ({ parsedInput: input }) => {
    if (process.env.VERCEL_ENV === "preview") {
      throw new ActionError("Form tidak aktif di preview. Hubungi marketing lewat WhatsApp.");
    }

    const ip = await clientIp();
    const ipHash = hashKey(ip);
    const base = { formKind: input.formKind, pagePath: input.pagePath, ipHash };
    const brochureUrl = input.formKind === "brosur" ? brochureFor(input.projectSlug) : null;

    if (input.website) {
      await recordSubmission({ ...base, status: "ditolak_honeypot" });
      return { ok: true as const, brochureUrl };
    }

    const phone = normalizePhoneID(input.phone);
    if (!phone) throw new ActionError("Nomor HP tidak valid. Contoh: 0812 3456 7890.");

    const [ipAllowed, phoneAllowed] = await Promise.all([
      hitRateLimit("lead-ip", ip, 60 * 60, 10),
      hitRateLimit("lead-hp", phone, 60 * 60, 3),
    ]);
    if (!ipAllowed || !phoneAllowed) {
      await recordSubmission({ ...base, status: "ditolak_rate_limit" });
      throw new ActionError(
        "Terlalu banyak kiriman. Coba lagi dalam 1 jam atau hubungi kami lewat WhatsApp.",
      );
    }

    if (!(await verifyTurnstile(input.turnstileToken, ip))) {
      await recordSubmission({ ...base, status: "ditolak_turnstile" });
      throw new ActionError("Verifikasi keamanan gagal. Muat ulang halaman, lalu kirim lagi.");
    }

    const admin = createSupabaseAdminClient();
    let projectId: string | null = null;
    if (input.projectSlug) {
      const { data } = await admin
        .from("projects")
        .select("id")
        .eq("slug", input.projectSlug)
        .is("deleted_at", null)
        .maybeSingle();
      projectId = data?.id ?? null;
    }

    const note = [input.formKind === "brosur" ? "Minta brosur." : null, input.message]
      .filter(Boolean)
      .join(" ");

    const args = {
      p_full_name: input.fullName,
      p_phone: phone,
      p_email: input.email || null,
      p_project_id: projectId,
      p_unit_type_id: null,
      p_source_kind: "website",
      p_source_detail: SOURCE_DETAIL[input.formKind],
      p_note: note || null,
      p_consent_text_version: PRIVACY_POLICY_VERSION,
    } as unknown as Database["public"]["Functions"]["upsert_lead"]["Args"];
    const { data: rows, error } = await admin.rpc("upsert_lead", args);
    const lead = rows?.[0];
    if (error || !lead) throw new Error(`Lead gagal disimpan: ${error?.message ?? "tanpa data"}`);
    if (lead.is_new) await notifyLeadEntry(lead.lead_id);

    const tracking = input.tracking;
    if (tracking && Object.values(tracking).some(Boolean)) {
      await admin.from("utm_touchpoints").insert({
        lead_id: lead.lead_id,
        visitor_id: tracking.visitorId ?? null,
        utm_source: tracking.utmSource ?? null,
        utm_medium: tracking.utmMedium ?? null,
        utm_campaign: tracking.utmCampaign ?? null,
        utm_content: tracking.utmContent ?? null,
        utm_term: tracking.utmTerm ?? null,
        fbclid: tracking.fbclid ?? null,
        referrer: tracking.referrer ?? null,
        landing_path: tracking.landingPath ?? null,
      });
    }

    await recordSubmission({
      ...base,
      status: "diterima",
      leadId: lead.lead_id,
      payload: { project: input.projectSlug ?? null, has_email: Boolean(input.email) },
    });
    return { ok: true as const, brochureUrl };
  });
