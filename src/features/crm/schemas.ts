import { z } from "zod";
import { LEAD_STAGES, LOGGABLE_ACTIVITIES, MANUAL_LEAD_SOURCES } from "@/config/crm";
import { normalizePhoneID } from "@/lib/format";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || undefined);

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(2, "Isi nama konsumen.").max(120, "Nama maksimal 120 karakter."),
  phone: z
    .string()
    .trim()
    .refine((value) => normalizePhoneID(value) !== null, "Isi nomor HP yang valid, misal 0812..."),
  email: z
    .union([z.literal(""), z.email("Format email belum benar.")])
    .optional()
    .transform((value) => value || undefined),
  projectId: z.uuid().nullable().optional(),
  source: z.enum(MANUAL_LEAD_SOURCES, "Pilih sumber lead."),
  note: optionalText(500, "Catatan maksimal 500 karakter."),
  consent: z.literal(true, "Konsumen harus setuju datanya disimpan."),
});
export type CreateLeadInput = z.input<typeof createLeadSchema>;

export const changeStageSchema = z
  .object({
    leadId: z.uuid(),
    stage: z.enum(LEAD_STAGES, "Pilih tahap."),
    lostReason: optionalText(300, "Alasan maksimal 300 karakter."),
  })
  .refine((value) => value.stage !== "batal" || (value.lostReason?.length ?? 0) >= 5, {
    path: ["lostReason"],
    message: "Tulis alasan batal minimal 5 karakter.",
  });
export type ChangeStageInput = z.input<typeof changeStageSchema>;

export const logActivitySchema = z.object({
  leadId: z.uuid(),
  clientId: z.uuid(),
  type: z.enum(LOGGABLE_ACTIVITIES, "Pilih jenis aktivitas."),
  body: z
    .string()
    .trim()
    .min(3, "Tulis hasilnya minimal 3 karakter.")
    .max(1000, "Catatan maksimal 1000 karakter."),
});
export type LogActivityInput = z.input<typeof logActivitySchema>;

export const reassignLeadSchema = z.object({
  leadId: z.uuid(),
  toUserId: z.union([z.uuid(), z.literal("antrean")], "Pilih marketing."),
});
export type ReassignLeadInput = z.input<typeof reassignLeadSchema>;

export const crmSettingsSchema = z.object({
  slaMinutes: z
    .number("Isi angka menit.")
    .int("Isi angka bulat.")
    .min(5, "Minimal 5 menit.")
    .max(1440, "Maksimal 1440 menit (24 jam)."),
});
export type CrmSettingsInput = z.input<typeof crmSettingsSchema>;
