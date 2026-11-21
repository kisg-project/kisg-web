import { z } from "zod";

const email = z
  .string({ error: "Isi email." })
  .trim()
  .toLowerCase()
  .min(1, "Isi email.")
  .max(254, "Email terlalu panjang.")
  .pipe(z.email("Format email tidak valid. Contoh: nama@kisgroup.co.id."));

/** Aplikasi tujuan: portal karyawan atau panel CMS (akun terpisah, keputusan owner). */
export const authApp = z.enum(["portal", "cms"]).default("portal");
export type AuthApp = z.infer<typeof authApp>;

export const loginSchema = z.object({
  app: authApp,
  email,
  password: z
    .string({ error: "Isi password." })
    .min(1, "Isi password.")
    .max(128, "Password terlalu panjang."),
  next: z.string().max(200).optional(),
});

export const forgotPasswordSchema = z.object({ app: authApp, email });

/** Sama dengan aturan Supabase Auth (scripts/supabase-auth-config.mjs dan config.toml). */
export const newPasswordSchema = z
  .object({
    password: z
      .string({ error: "Isi password baru." })
      .min(10, "Password minimal 10 karakter.")
      .max(128, "Password maksimal 128 karakter.")
      .regex(/[a-z]/, "Password harus memuat huruf kecil.")
      .regex(/[A-Z]/, "Password harus memuat huruf besar.")
      .regex(/[0-9]/, "Password harus memuat angka."),
    confirm: z.string({ error: "Ulangi password baru." }),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Konfirmasi password tidak sama.",
  });

/** Kode 6 digit dari email (OTP Supabase Auth). */
export const otpCode = z
  .string({ error: "Masukkan kode dari email." })
  .trim()
  .regex(/^\d{6}$/, "Masukkan 6 digit kode dari email.");

/** Lupa password langkah kedua: kode dari email dan password baru (keputusan owner, OTP). */
export const resetWithCodeSchema = z
  .object({
    app: authApp,
    email,
    code: otpCode,
    password: newPasswordSchema.shape.password,
    confirm: z.string({ error: "Ulangi password baru." }),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Konfirmasi password tidak sama.",
  });

export type LoginInput = z.input<typeof loginSchema>;
export type ResetWithCodeInput = z.input<typeof resetWithCodeSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
