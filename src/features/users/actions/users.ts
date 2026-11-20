"use server";

import { headers } from "next/headers";
import { isAppRole, orderRoles, type AppRole } from "@/config/roles";
import { sendInviteEmail } from "@/features/notifications";
import { portalBase } from "@/features/pwa";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  inviteUserSchema,
  pendingInviteSchema,
  setUserActiveSchema,
  setUserRolesSchema,
} from "../schemas/users";
import { manageProblem } from "../utils/rules";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

/** Tautan aktivasi di host yang sedang dipakai owner (subdomain portal atau /portal). */
async function activationLink(tokenHash: string, type: "invite" | "magiclink"): Promise<string> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "";
  const local = host.startsWith("127.0.0.1") || host.startsWith("localhost");
  const protocol = store.get("x-forwarded-proto") ?? (local ? "http" : "https");
  const base = portalBase(host, process.env.PORTAL_HOST);
  const params = new URLSearchParams({ token_hash: tokenHash, type, next: "/portal/aktivasi" });
  return `${protocol}://${host}${base}/auth/confirm?${params.toString()}`;
}

async function rolesOf(supabase: ServerClient, userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((row) => row.role).filter(isAppRole);
}

async function fullNameOf(client: ServerClient, userId: string): Promise<string> {
  const { data } = await client.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name ?? "";
}

/** Email undangan. Gagal kirim tidak menggagalkan undangan: owner tetap mendapat tautan. */
async function deliverInvite(input: Parameters<typeof sendInviteEmail>[0]) {
  try {
    return (await sendInviteEmail(input)).sent;
  } catch (error) {
    console.error("Email undangan gagal dikirim", error);
    return false;
  }
}

function roleError(message: string): Error {
  return /owner/i.test(message)
    ? new ActionError("Role owner hanya bisa diatur oleh owner.")
    : new Error(`Role gagal disimpan: ${message}`);
}

/**
 * Mengundang karyawan. Akun dibuat lewat API admin Supabase (generateLink), role ditetapkan lewat
 * public.set_user_roles dengan sesi pengundang (tercatat di audit_log), lalu email undangan berkop
 * dikirim. Kalau email belum dikonfigurasi atau gagal, tautan ditampilkan untuk disalin.
 */
export const inviteUserAction = adminActionClient
  .inputSchema(inviteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const problem = manageProblem({
      actorId: ctx.userId,
      actorRoles: ctx.roles,
      targetId: "",
      targetRoles: [],
      nextRoles: parsedInput.roles,
    });
    if (problem) throw new ActionError(problem);

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email: parsedInput.email,
      options: { data: { full_name: parsedInput.fullName } },
    });
    if (error) {
      if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
        throw new ActionError("Email sudah terdaftar. Cari akunnya di daftar karyawan.");
      }
      throw new Error(`Undangan gagal dibuat: ${error.message}`);
    }
    const userId = data.user.id;
    const roles = orderRoles(parsedInput.roles, parsedInput.primaryRole);
    const { error: rolesError } = await ctx.supabase.rpc("set_user_roles", {
      p_user: userId,
      p_roles: roles,
      p_primary: parsedInput.primaryRole,
    });
    if (rolesError) {
      // Akun tanpa role tidak bisa masuk portal, jadi hapus supaya bisa diulang.
      await admin.auth.admin.deleteUser(userId);
      throw roleError(rolesError.message);
    }
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: parsedInput.fullName,
        invited_at: new Date().toISOString(),
        invited_by: ctx.userId,
        activated_at: null,
        needs_password: true,
      })
      .eq("id", userId);
    if (profileError) throw new Error(`Profil undangan gagal disimpan: ${profileError.message}`);

    const link = await activationLink(data.properties.hashed_token, "invite");
    const emailed = await deliverInvite({
      email: parsedInput.email,
      name: parsedInput.fullName,
      inviterName: (await fullNameOf(ctx.supabase, ctx.userId)) || "Owner KIS Group",
      roles,
      link,
    });
    return { email: parsedInput.email, link, emailed };
  });

/** Akun undangan yang belum aktivasi. Akun aktif tidak boleh dikirim ulang atau dibatalkan. */
async function pendingAccount(admin: AdminClient, userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("email, full_name, activated_at")
    .eq("id", userId)
    .maybeSingle();
  if (!data) throw new ActionError("Akun tidak ditemukan. Muat ulang halaman.");
  if (data.activated_at) {
    throw new ActionError("Akun ini sudah aktif. Gunakan nonaktifkan kalau perlu.");
  }
  return data;
}

/**
 * Mengirim ulang undangan dengan tautan baru (tautan lama tidak berlaku lagi setelah tautan baru
 * dibuat). Akun yang sudah membuka tautan tetapi belum menyelesaikan aktivasi memakai magic link.
 */
export const resendInviteAction = adminActionClient
  .inputSchema(pendingInviteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const targetRoles = await rolesOf(ctx.supabase, parsedInput.userId);
    const problem = manageProblem({
      actorId: ctx.userId,
      actorRoles: ctx.roles,
      targetId: parsedInput.userId,
      targetRoles,
    });
    if (problem) throw new ActionError(problem);

    const admin = createSupabaseAdminClient();
    const account = await pendingAccount(admin, parsedInput.userId);
    let generated = await admin.auth.admin.generateLink({ type: "invite", email: account.email });
    let type: "invite" | "magiclink" = "invite";
    if (generated.error?.code === "email_exists") {
      generated = await admin.auth.admin.generateLink({ type: "magiclink", email: account.email });
      type = "magiclink";
    }
    if (generated.error) throw new Error(`Undangan gagal dibuat: ${generated.error.message}`);

    await admin
      .from("profiles")
      .update({ invited_at: new Date().toISOString(), invited_by: ctx.userId })
      .eq("id", parsedInput.userId);
    const link = await activationLink(generated.data.properties.hashed_token, type);
    const emailed = await deliverInvite({
      email: account.email,
      name: account.full_name,
      inviterName: (await fullNameOf(ctx.supabase, ctx.userId)) || "Owner KIS Group",
      roles: targetRoles,
      link,
    });
    return { email: account.email, link, emailed };
  });

/** Membatalkan undangan yang belum diaktivasi: akun dihapus, tautan tidak berlaku lagi. */
export const cancelInviteAction = adminActionClient
  .inputSchema(pendingInviteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const problem = manageProblem({
      actorId: ctx.userId,
      actorRoles: ctx.roles,
      targetId: parsedInput.userId,
      targetRoles: await rolesOf(ctx.supabase, parsedInput.userId),
    });
    if (problem) throw new ActionError(problem);
    const admin = createSupabaseAdminClient();
    await pendingAccount(admin, parsedInput.userId);
    const { error } = await admin.auth.admin.deleteUser(parsedInput.userId);
    if (error) throw new Error(`Undangan gagal dibatalkan: ${error.message}`);
    return { ok: true as const };
  });

/** Mengubah semua role akun sekaligus (multi role) beserta role utamanya. */
export const setUserRolesAction = adminActionClient
  .inputSchema(setUserRolesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const problem = manageProblem({
      actorId: ctx.userId,
      actorRoles: ctx.roles,
      targetId: parsedInput.userId,
      targetRoles: await rolesOf(ctx.supabase, parsedInput.userId),
      nextRoles: parsedInput.roles,
    });
    if (problem) throw new ActionError(problem);
    const { error } = await ctx.supabase.rpc("set_user_roles", {
      p_user: parsedInput.userId,
      p_roles: orderRoles(parsedInput.roles, parsedInput.primaryRole),
      p_primary: parsedInput.primaryRole,
    });
    if (error) throw roleError(error.message);
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
      actorRoles: ctx.roles,
      targetId: parsedInput.userId,
      targetRoles: await rolesOf(ctx.supabase, parsedInput.userId),
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
