"use server";

import { headers } from "next/headers";
import { isAppRole } from "@/config/roles";
import { portalBase } from "@/features/pwa";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { inviteUserSchema, setUserActiveSchema, setUserRoleSchema } from "../schemas/users";
import { manageProblem } from "../utils/rules";

/** Tautan undangan di host yang sedang dipakai admin (subdomain portal atau /portal). */
async function inviteLink(tokenHash: string): Promise<string> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "";
  const local = host.startsWith("127.0.0.1") || host.startsWith("localhost");
  const protocol = store.get("x-forwarded-proto") ?? (local ? "http" : "https");
  const base = portalBase(host, process.env.PORTAL_HOST);
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "invite",
    next: "/portal/reset-password",
  });
  return `${protocol}://${host}${base}/auth/confirm?${params.toString()}`;
}

/**
 * Mengundang karyawan. Akun dibuat lewat API admin Supabase (generateLink) dan tautan undangan
 * ditampilkan ke admin untuk dikirim lewat WhatsApp, karena email sistem baru aktif setelah Brevo
 * dipasang. Role ditetapkan lewat public.set_user_role dengan sesi admin (tercatat di audit_log).
 */
export const inviteUserAction = adminActionClient
  .inputSchema(inviteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email: parsedInput.email,
      options: { data: { full_name: parsedInput.fullName } },
    });
    if (error) {
      if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
        throw new ActionError("Email sudah terdaftar. Cari akunnya di daftar pengguna.");
      }
      throw new Error(`Undangan gagal dibuat: ${error.message}`);
    }
    const { error: roleError } = await ctx.supabase.rpc("set_user_role", {
      p_user: data.user.id,
      p_role: parsedInput.role,
    });
    if (roleError) {
      // Akun tanpa role tidak bisa masuk portal, jadi hapus supaya admin bisa mengulang.
      await admin.auth.admin.deleteUser(data.user.id);
      throw new Error(`Role gagal disimpan: ${roleError.message}`);
    }
    return {
      email: parsedInput.email,
      link: await inviteLink(data.properties.hashed_token),
    };
  });

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function targetRole(supabase: ServerClient, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role && isAppRole(data.role) ? data.role : null;
}

export const setUserRoleAction = adminActionClient
  .inputSchema(setUserRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const problem = manageProblem({
      actorId: ctx.userId,
      actorRole: ctx.role,
      targetId: parsedInput.userId,
      targetRole: await targetRole(ctx.supabase, parsedInput.userId),
      nextRole: parsedInput.role,
    });
    if (problem) throw new ActionError(problem);
    const { error } = await ctx.supabase.rpc("set_user_role", {
      p_user: parsedInput.userId,
      p_role: parsedInput.role,
    });
    if (error) throw new Error(`Role gagal diubah: ${error.message}`);
    return { ok: true as const };
  });

/**
 * Menonaktifkan atau mengaktifkan akun. Akun nonaktif juga diblokir di Supabase Auth, jadi sesinya
 * tidak bisa diperpanjang. Akses langsung tertutup karena setiap halaman dan RLS memeriksa is_active.
 */
export const setUserActiveAction = adminActionClient
  .inputSchema(setUserActiveSchema)
  .action(async ({ parsedInput, ctx }) => {
    const problem = manageProblem({
      actorId: ctx.userId,
      actorRole: ctx.role,
      targetId: parsedInput.userId,
      targetRole: await targetRole(ctx.supabase, parsedInput.userId),
    });
    if (problem) throw new ActionError(problem);
    const { error } = await ctx.supabase.rpc("set_user_active", {
      p_user: parsedInput.userId,
      p_active: parsedInput.active,
    });
    if (error) throw new Error(`Status akun gagal diubah: ${error.message}`);
    const { error: banError } = await createSupabaseAdminClient().auth.admin.updateUserById(
      parsedInput.userId,
      { ban_duration: parsedInput.active ? "none" : "876000h" },
    );
    if (banError) throw new Error(`Sesi akun gagal diperbarui: ${banError.message}`);
    return { ok: true as const };
  });
