import "server-only";
import { notify } from "@/features/notifications/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function notifyLeadEntry(leadId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("id, full_name, owner_id, source_detail, source_kind")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return;
  const href = `/portal/crm/${lead.id}`;
  if (lead.owner_id) {
    await notify([lead.owner_id], {
      kind: "lead_baru",
      title: `Lead baru: ${lead.full_name}`,
      body: "Hubungi sebelum batas respons supaya lead tidak kembali ke antrean.",
      href,
      dedupeKey: `lead:${lead.id}:baru:${lead.owner_id}`,
      email: true,
    });
    return;
  }
  const { data: managers } = await admin.rpc("crm_managers");
  await notify(managers ?? [], {
    kind: "lead_antrean",
    title: `Lead masuk antrean: ${lead.full_name}`,
    body: "Belum ada marketing yang bertugas. Bagikan ke marketing dari CRM.",
    href,
    dedupeKey: `lead:${lead.id}:antrean`,
    email: true,
  });
}

export async function notifyLeadReassigned(
  leadId: string,
  toUserId: string,
  fullName: string,
): Promise<void> {
  await notify([toUserId], {
    kind: "lead_baru",
    title: `Lead dipindahkan ke Anda: ${fullName}`,
    body: "Hubungi sebelum batas respons supaya lead tidak kembali ke antrean.",
    href: `/portal/crm/${leadId}`,
    dedupeKey: `lead:${leadId}:pindah:${toUserId}:${String(Date.now())}`,
    email: true,
  });
}
