import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { PRIVACY_POLICY_VERSION } from "@/config/legal";
import { KPR_DEFAULTS } from "@/config/kpr";
import { KPR_PRODUCTS, lowestRate } from "@/config/kpr-products";
import { whatsappLink } from "@/config/site";
import { notifyLeadEntry } from "@/features/crm/server";
import { calculateKpr, downPaymentFromPercent } from "@/features/kpr";
import { formatRupiah, normalizePhoneID } from "@/lib/format";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export interface ChatToolContext {
  sessionId: string;
  defaultPrice: number | null;
  projectId: string | null;
}

export function chatTools(context: ChatToolContext) {
  return {
    calculate_kpr: tool({
      description:
        "Hitung perkiraan cicilan KPR per bulan dari harga rumah, uang muka, dan jangka waktu. Wajib dipakai untuk setiap angka cicilan.",
      inputSchema: z.object({
        price: z
          .number()
          .int()
          .min(50_000_000)
          .max(10_000_000_000)
          .optional()
          .describe("Harga rumah dalam rupiah. Kosongkan untuk harga unit proyek unggulan."),
        downPaymentPercent: z
          .number()
          .min(0)
          .max(90)
          .optional()
          .describe("Uang muka dalam persen."),
        tenorYears: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Jangka waktu dalam tahun."),
        scheme: z.enum(["konvensional", "syariah"]).optional(),
      }),
      execute: ({ price, downPaymentPercent, tenorYears, scheme }) => {
        const basePrice = price ?? context.defaultPrice;
        if (!basePrice) return { ok: false as const, reason: "Harga rumah belum diketahui." };
        const products = KPR_PRODUCTS.filter((product) => !scheme || product.scheme === scheme);
        const product = [...products].sort((a, b) => lowestRate(a) - lowestRate(b))[0];
        if (!product) return { ok: false as const, reason: "Produk KPR tidak ditemukan." };
        const percent = downPaymentPercent ?? KPR_DEFAULTS.downPaymentPercent;
        const tenor = Math.min(
          product.tenor.max,
          Math.max(product.tenor.min, tenorYears ?? KPR_DEFAULTS.tenorYears),
        );
        const downPayment = downPaymentFromPercent(basePrice, percent);
        const result = calculateKpr({
          price: basePrice,
          downPayment,
          tenorYears: tenor,
          segments: product.segments,
          afterRatePercent:
            product.afterRatePercent ??
            (product.scheme === "syariah"
              ? KPR_DEFAULTS.syariahAfterMarginPercent
              : KPR_DEFAULTS.floatingRatePercent),
        });
        return {
          ok: true as const,
          produk: product.name,
          hargaRumah: formatRupiah(basePrice),
          uangMuka: `${formatRupiah(downPayment)} (${String(percent)}%)`,
          pokokPinjaman: formatRupiah(basePrice - downPayment),
          jangkaWaktuTahun: tenor,
          cicilanPerPeriode: result.periods.map((period) => ({
            bulan: `${String(period.fromMonth)} sampai ${String(period.toMonth)}`,
            bungaPersen: period.ratePercent,
            perBulan: formatRupiah(period.monthly),
            asumsi: period.isAfter,
          })),
          catatan:
            "Perkiraan. Bunga setelah masa tetap memakai asumsi. Angka pasti mengikuti penilaian bank.",
          halamanSimulasi: "/simulasi-kpr",
        };
      },
    }),

    create_lead: tool({
      description:
        "Catat nama dan nomor WhatsApp pengunjung supaya marketing menghubungi. Pakai hanya setelah pengunjung menyatakan setuju datanya dipakai.",
      inputSchema: z.object({
        fullName: z.string().min(2).max(80),
        phone: z.string().min(8).max(20).describe("Nomor WhatsApp, misal 0812 3456 7890."),
        consent: z.boolean().describe("true hanya kalau pengunjung sudah menjawab setuju."),
        note: z.string().max(300).optional().describe("Ringkasan kebutuhan pengunjung."),
      }),
      execute: async ({ fullName, phone, consent, note }) => {
        if (!consent) return { ok: false as const, reason: "Pengunjung belum menyatakan setuju." };
        const normalized = normalizePhoneID(phone);
        if (!normalized) return { ok: false as const, reason: "Nomor HP tidak valid." };
        if (!(await hitRateLimit("chat-lead-hp", normalized, 60 * 60, 3))) {
          return {
            ok: false as const,
            reason: "Nomor ini baru saja dicatat. Tidak perlu diulang.",
          };
        }
        const admin = createSupabaseAdminClient();
        const args = {
          p_full_name: fullName.trim(),
          p_phone: normalized,
          p_email: null,
          p_project_id: context.projectId,
          p_unit_type_id: null,
          p_source_kind: "chat",
          p_source_detail: "Chat website (Jaka)",
          p_note: note?.trim() || null,
          p_consent_text_version: PRIVACY_POLICY_VERSION,
        } as unknown as Database["public"]["Functions"]["upsert_lead"]["Args"];
        const { data, error } = await admin.rpc("upsert_lead", args);
        const lead = data?.[0];
        if (error || !lead) return { ok: false as const, reason: "Data belum tersimpan." };
        if (lead.is_new) await notifyLeadEntry(lead.lead_id);
        await admin
          .from("chat_sessions")
          .update({ lead_id: lead.lead_id })
          .eq("id", context.sessionId);
        return {
          ok: true as const,
          pesan: "Data tersimpan. Marketing akan menghubungi lewat WhatsApp.",
        };
      },
    }),

    handoff_to_human: tool({
      description:
        "Sambungkan pengunjung ke marketing lewat WhatsApp, misalnya untuk jadwal survei, negosiasi, atau pertanyaan yang datanya tidak ada.",
      inputSchema: z.object({
        reason: z.enum(["survei", "marketing", "negosiasi", "lainnya"]),
        summary: z
          .string()
          .max(300)
          .describe("Ringkasan singkat kebutuhan pengunjung untuk pesan pembuka WhatsApp."),
      }),
      execute: async ({ reason, summary }) => {
        await createSupabaseAdminClient()
          .from("chat_sessions")
          .update({ status: "diserahkan" })
          .eq("id", context.sessionId);
        const opening =
          reason === "survei"
            ? "Halo, saya ingin jadwal survei."
            : "Halo, saya dari chat website KIS Group.";
        return {
          ok: true as const,
          whatsappUrl: whatsappLink(`${opening} ${summary}`.slice(0, 500)),
        };
      },
    }),
  };
}
