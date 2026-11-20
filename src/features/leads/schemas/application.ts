import { z } from "zod";
import { normalizePhoneID } from "@/lib/format";

/** Batas CV pelamar: sama dengan file_size_limit bucket job-applications (2 MB, PDF). */
export const CV_MAX_BYTES = 2 * 1024 * 1024;

export const applicationSchema = z.object({
  fullName: z
    .string({ error: "Isi nama lengkap." })
    .trim()
    .min(2, "Isi nama lengkap, minimal 2 huruf.")
    .max(80, "Nama maksimal 80 karakter."),
  phone: z
    .string({ error: "Isi nomor WhatsApp." })
    .trim()
    .min(1, "Isi nomor WhatsApp.")
    .refine((value) => normalizePhoneID(value) !== null, {
      message: "Nomor HP tidak valid. Contoh: 0812 3456 7890.",
    }),
  email: z
    .string({ error: "Isi email." })
    .trim()
    .min(1, "Isi email.")
    .max(254, "Email terlalu panjang.")
    .pipe(z.email("Format email tidak valid. Contoh: nama@email.com.")),
  coverNote: z.string().trim().max(1500, "Catatan maksimal 1.500 karakter.").optional(),
  consent: z.boolean().refine((value) => value, {
    message: "Centang persetujuan supaya lamaran bisa diproses.",
  }),
  website: z.string().max(200).optional(),
  careerSlug: z.string().min(1).max(120),
  turnstileToken: z.string().max(4096).optional(),
});

export type ApplicationInput = z.input<typeof applicationSchema>;

/** Pesan kesalahan file CV, atau null kalau file bisa diterima. */
export function cvProblem(
  file: { size: number; type: string; name: string } | null | undefined,
): string | null {
  if (!file || file.size === 0) return "Lampirkan CV dalam format PDF.";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "CV harus berformat PDF.";
  }
  if (file.size > CV_MAX_BYTES) return "Ukuran CV maksimal 2 MB.";
  return null;
}

/** Empat byte pertama file PDF selalu "%PDF". Cegah file lain yang hanya diganti namanya. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
