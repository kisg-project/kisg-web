import { z } from "zod";

/** Tanda tangan elektronik: password akun penyetuju, ditambah lokasi kalau diizinkan browser. */
export const signatureSchema = z.object({
  password: z
    .string({ error: "Masukkan password akun Anda." })
    .min(1, "Masukkan password akun Anda."),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export type SignatureInput = z.input<typeof signatureSchema>;
