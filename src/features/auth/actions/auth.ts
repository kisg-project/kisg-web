"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/config/portal";
import { env } from "@/env";
import { loadAccountRoles } from "@/lib/auth/account-roles";
import { ActionError, actionClient, authActionClient } from "@/lib/safe-action";
import { clientIp, hitRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, newPasswordSchema } from "../schemas/auth";

const LOGIN_WINDOW = 15 * 60;
const GENERIC_LOGIN_ERROR = "Email atau password salah.";
const LOCKED_ERROR = "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.";

export const loginAction = actionClient.inputSchema(loginSchema).action(async ({ parsedInput }) => {
  const ip = await clientIp();
  const [ipAllowed, accountAllowed] = await Promise.all([
    hitRateLimit("login-ip", ip, LOGIN_WINDOW, 20),
    hitRateLimit("login-akun", parsedInput.email, LOGIN_WINDOW, 5),
  ]);
  if (!ipAllowed || !accountAllowed) throw new ActionError(LOCKED_ERROR);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsedInput.email,
    password: parsedInput.password,
  });
  if (error) throw new ActionError(GENERIC_LOGIN_ERROR);

  const { roles } = await loadAccountRoles(supabase, data.user.id);
  if (roles.length === 0) {
    await supabase.auth.signOut();
    throw new ActionError("Akun Anda tidak aktif. Hubungi owner.");
  }
  // Redirect dari server: cookie sesi dan navigasi dikirim dalam satu response, tanpa refresh
  // halaman login yang bisa terputus di Safari. Akun yang belum lengkap diarahkan ke aktivasi oleh
  // layout portal.
  redirect(safeNextPath(parsedInput.next, roles));
});

/** Selalu menjawab sukses yang sama, supaya tidak membocorkan email mana yang terdaftar. */
export const forgotPasswordAction = actionClient
  .inputSchema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const ip = await clientIp();
    const [ipAllowed, accountAllowed] = await Promise.all([
      hitRateLimit("reset-ip", ip, 60 * 60, 10),
      hitRateLimit("reset-akun", parsedInput.email, 60 * 60, 3),
    ]);
    if (!ipAllowed || !accountAllowed) {
      throw new ActionError("Terlalu banyak permintaan. Coba lagi dalam 1 jam.");
    }
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsedInput.email, {
      // Lewat /portal/auth/confirm: tautan template bawaan Supabase membawa parameter code (PKCE),
      // template Indonesia membawa token_hash. Keduanya ditangani di sana.
      redirectTo: new URL(
        "/portal/auth/confirm?next=/portal/reset-password",
        env.NEXT_PUBLIC_SITE_URL,
      ).toString(),
    });
    return { sent: true };
  });

export const updatePasswordAction = authActionClient
  .inputSchema(newPasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase.auth.updateUser({ password: parsedInput.password });
    if (error) {
      throw new ActionError(
        error.code === "same_password"
          ? "Password baru tidak boleh sama dengan password lama."
          : "Password gagal disimpan. Buka lagi tautan dari email, lalu coba lagi.",
      );
    }
    redirect(safeNextPath(null, ctx.roles));
  });
