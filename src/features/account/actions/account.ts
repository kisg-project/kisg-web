"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { safeNextPath } from "@/config/portal";
import { ActionError, authActionClient } from "@/lib/safe-action";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { activationSchema, changePasswordSchema, profileSchema } from "../schemas/account";

const PASSWORD_ERRORS: Record<string, string> = {
  same_password: "Password baru tidak boleh sama dengan password lama.",
  weak_password:
    "Password terlalu lemah. Pakai minimal 10 karakter dengan huruf besar, huruf kecil, dan angka.",
};

function passwordError(code: string | undefined): ActionError {
  return new ActionError(
    (code && PASSWORD_ERRORS[code]) ?? "Password gagal disimpan. Coba lagi sebentar lagi.",
  );
}

/**
 * Menyelesaikan aktivasi akun undangan (atau melengkapi akun lama): nama, nomor HP, password (wajib
 * untuk akun undangan), dan foto profil yang sudah diunggah lewat /portal/foto-profil.
 * Kolom activated_at dan needs_password diisi server karena tidak boleh diubah pemilik akun.
 */
export const activateAccountAction = authActionClient
  .inputSchema(activationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("avatar_path, needs_password")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!profile?.avatar_path) throw new ActionError("Ambil atau pilih foto profil dulu.");
    const password = parsedInput.password ?? "";
    // Server tidak percaya nilai needsPassword dari browser.
    if (profile.needs_password && password.length === 0) {
      throw new ActionError("Buat password untuk akun Anda.");
    }
    if (password.length > 0) {
      const { error } = await ctx.supabase.auth.updateUser({ password });
      if (error) throw passwordError(error.code);
    }

    const { error: profileError } = await ctx.supabase
      .from("profiles")
      .update({ full_name: parsedInput.fullName, phone: parsedInput.phone })
      .eq("id", ctx.userId);
    if (profileError) throw new Error(`Profil gagal disimpan: ${profileError.message}`);
    const { error: activateError } = await createSupabaseAdminClient()
      .from("profiles")
      .update({ activated_at: new Date().toISOString(), needs_password: false })
      .eq("id", ctx.userId);
    if (activateError) throw new Error(`Aktivasi gagal disimpan: ${activateError.message}`);

    redirect(safeNextPath(null, ctx.roles));
  });

/** Mengubah nama dan nomor HP di halaman Akun saya. */
export const updateProfileAction = authActionClient
  .inputSchema(profileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("profiles")
      .update({ full_name: parsedInput.fullName, phone: parsedInput.phone })
      .eq("id", ctx.userId);
    if (error) throw new Error(`Profil gagal disimpan: ${error.message}`);
    return { ok: true as const };
  });

/**
 * Ganti password di Akun saya dengan kode email (OTP, keputusan owner): langkah pertama mengirim kode
 * 6 digit ke email akun (template kode password Supabase Auth). Dibatasi 3 kali per 15 menit.
 */
export const sendPasswordCodeAction = authActionClient.action(async ({ ctx }) => {
  const allowed = await hitRateLimit("kode-password", ctx.userId, 15 * 60, 3);
  if (!allowed)
    throw new ActionError("Kode sudah dikirim beberapa kali. Coba lagi dalam 15 menit.");
  const { error } = await ctx.supabase.auth.resetPasswordForEmail(ctx.email);
  if (error) throw new ActionError("Kode belum terkirim. Coba lagi sebentar lagi.");
  return { sentTo: ctx.email };
});

/**
 * Langkah kedua: kode diverifikasi lewat klien Supabase terpisah tanpa cookie (sesi yang dipakai tidak
 * berubah), lalu password baru disimpan. Kode selalu dicek, termasuk untuk sesi yang baru masuk.
 * Dibatasi 5 kali per 15 menit.
 */
export const changePasswordAction = authActionClient
  .inputSchema(changePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const allowed = await hitRateLimit("ganti-password", ctx.userId, 15 * 60, 5);
    if (!allowed) throw new ActionError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");

    const { url, publishableKey } = getSupabaseConfig();
    const verifier = createClient<Database>(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error: wrong } = await verifier.auth.verifyOtp({
      email: ctx.email,
      token: parsedInput.code,
      type: "recovery",
    });
    if (wrong || data.user?.id !== ctx.userId) {
      throw new ActionError("Kode salah atau sudah tidak berlaku. Minta kode baru.");
    }
    await verifier.auth.signOut({ scope: "local" });

    const { error } = await ctx.supabase.auth.updateUser({ password: parsedInput.password });
    if (error) throw passwordError(error.code);
    return { ok: true as const };
  });
