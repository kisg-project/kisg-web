import { z } from "zod";
import { normalizePhoneID } from "@/lib/format";

// Skema form lead publik. Dipakai di browser (React Hook Form) dan di server action yang sama
// (CLAUDE.md bagian 5: validasi client dan server dengan schema yang sama).

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const trackingSchema = z
  .object({
    visitorId: z.string().max(64).optional(),
    utmSource: z.string().max(120).optional(),
    utmMedium: z.string().max(120).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),
    utmTerm: z.string().max(200).optional(),
    fbclid: z.string().max(500).optional(),
    referrer: z.string().max(500).optional(),
    landingPath: z.string().max(300).optional(),
  })
  .optional();

export type Tracking = z.infer<typeof trackingSchema>;

export const LEAD_FORM_KINDS = ["minat", "kontak", "brosur"] as const;

export const leadFormSchema = z.object({
  fullName: z
    .string({ error: "Isi nama Anda." })
    .trim()
    .min(2, "Isi nama Anda, minimal 2 huruf.")
    .max(80, "Nama maksimal 80 karakter."),
  phone: z
    .string({ error: "Isi nomor WhatsApp Anda." })
    .trim()
    .min(1, "Isi nomor WhatsApp Anda.")
    .refine((value) => normalizePhoneID(value) !== null, {
      message: "Nomor HP tidak valid. Contoh: 0812 3456 7890.",
    }),
  email: z
    .string()
    .trim()
    .max(254, "Email terlalu panjang.")
    .pipe(z.email("Format email tidak valid. Contoh: nama@email.com."))
    .optional()
    .or(z.literal("")),
  message: optionalText(1000, "Pesan maksimal 1.000 karakter."),
  consent: z.boolean().refine((value) => value, {
    message: "Centang persetujuan supaya marketing boleh menghubungi Anda.",
  }),
  // Honeypot: tidak terlihat oleh manusia. Bot yang mengisinya ditolak diam-diam.
  website: z.string().max(200).optional(),
  formKind: z.enum(LEAD_FORM_KINDS),
  projectSlug: z.string().max(120).optional(),
  pagePath: z.string().max(300).optional(),
  turnstileToken: z.string().max(4096).optional(),
  tracking: trackingSchema,
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
