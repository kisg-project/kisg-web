import { z } from "zod";
import { normalizePhoneID } from "@/lib/format";

const fullName = z
  .string({ error: "Isi nama lengkap." })
  .trim()
  .min(2, "Isi nama lengkap, minimal 2 huruf.")
  .max(80, "Nama maksimal 80 karakter.");

/** Nomor HP dinormalisasi ke E.164 (CLAUDE.md bagian 5). */
const phone = z
  .string({ error: "Isi nomor HP." })
  .trim()
  .min(1, "Isi nomor HP.")
  .transform((value, context) => {
    const normalized = normalizePhoneID(value);
    if (!normalized) {
      context.addIssue({
        code: "custom",
        message: "Nomor HP tidak valid. Contoh: 0812 3456 7890.",
      });
      return z.NEVER;
    }
    return normalized;
  });

/** Aturan password sama dengan Supabase Auth (minimal 10, huruf besar, huruf kecil, angka). */
export const passwordRule = z
  .string({ error: "Isi password." })
  .min(10, "Password minimal 10 karakter.")
  .max(128, "Password maksimal 128 karakter.")
  .regex(/[a-z]/, "Password harus memuat huruf kecil.")
  .regex(/[A-Z]/, "Password harus memuat huruf besar.")
  .regex(/[0-9]/, "Password harus memuat angka.");

export const profileSchema = z.object({ fullName, phone });

/**
 * Aktivasi akun. Password wajib untuk akun undangan (`needsPassword`), opsional untuk akun lama yang
 * sudah punya password (diisi kalau ingin mengganti).
 */
export const activationSchema = z
  .object({
    fullName,
    phone,
    needsPassword: z.boolean(),
    password: z.string().max(128).optional(),
    confirm: z.string().max(128).optional(),
  })
  .superRefine((value, context) => {
    const password = value.password ?? "";
    if (!value.needsPassword && password.length === 0) return;
    const checked = passwordRule.safeParse(password);
    if (!checked.success) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message:
          password.length === 0
            ? "Buat password untuk akun Anda."
            : (checked.error.issues[0]?.message ?? "Password tidak valid."),
      });
      return;
    }
    if (password !== value.confirm) {
      context.addIssue({
        code: "custom",
        path: ["confirm"],
        message: "Konfirmasi password tidak sama.",
      });
    }
  });

export const changePasswordSchema = z
  .object({
    current: z
      .string({ error: "Isi password saat ini." })
      .min(1, "Isi password saat ini.")
      .max(128),
    password: passwordRule,
    confirm: z.string({ error: "Ulangi password baru." }),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Konfirmasi password tidak sama.",
  })
  .refine((value) => value.password !== value.current, {
    path: ["password"],
    message: "Password baru tidak boleh sama dengan password saat ini.",
  });

export type ProfileInput = z.input<typeof profileSchema>;
export type ActivationInput = z.input<typeof activationSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
