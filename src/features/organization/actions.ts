"use server";

import { ActionError, adminActionClient } from "@/lib/safe-action";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assignHolderSchema, delegateSchema, endHolderSchema } from "./schemas";

const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

export const assignHolderAction = adminActionClient
  .inputSchema(assignHolderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const admin = createSupabaseAdminClient();
    const [{ data: position }, { data: roles }, { data: profile }] = await Promise.all([
      admin
        .from("positions")
        .select("id, default_role, title")
        .eq("id", parsedInput.positionId)
        .is("deleted_at", null)
        .maybeSingle(),
      admin.from("user_roles").select("role, is_primary").eq("user_id", parsedInput.userId),
      admin
        .from("profiles")
        .select("is_active, deleted_at")
        .eq("id", parsedInput.userId)
        .maybeSingle(),
    ]);
    if (!position) throw new ActionError("Jabatan tidak ditemukan.");
    if (!profile?.is_active || profile.deleted_at)
      throw new ActionError("Karyawan ini sudah nonaktif.");
    const owned = (roles ?? []).map((row) => row.role);
    if (owned.length === 0 || owned.every((role) => role === "cms")) {
      throw new ActionError("Akun ini bukan akun karyawan.");
    }
    if (position.default_role === "owner" && !ctx.roles.includes("owner")) {
      throw new ActionError("Jabatan Direktur Utama hanya bisa diatur oleh Direktur Utama.");
    }
    const { data: existing } = await admin
      .from("position_holders")
      .select("id")
      .eq("position_id", position.id)
      .eq("user_id", parsedInput.userId)
      .is("ended_at", null)
      .maybeSingle();
    if (existing) throw new ActionError("Karyawan ini sudah memegang jabatan tersebut.");
    const { error } = await admin
      .from("position_holders")
      .insert({ position_id: position.id, user_id: parsedInput.userId, created_by: ctx.userId });
    if (error) throw new Error(`Pemegang jabatan gagal disimpan: ${error.message}`);
    if (!owned.includes(position.default_role)) {
      const { error: roleError } = await admin.from("user_roles").insert({
        user_id: parsedInput.userId,
        role: position.default_role,
        is_primary: false,
        created_by: ctx.userId,
      });
      if (roleError) throw new Error(`Role jabatan gagal ditambahkan: ${roleError.message}`);
    }
    return { ok: true as const };
  });

export const endHolderAction = adminActionClient
  .inputSchema(endHolderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const admin = createSupabaseAdminClient();
    const { data: holder } = await admin
      .from("position_holders")
      .select("id, position_id, user_id, positions!position_holders_position_id_fkey(code)")
      .eq("id", parsedInput.holderId)
      .is("ended_at", null)
      .maybeSingle();
    if (!holder) throw new ActionError("Pemegang jabatan tidak ditemukan.");
    if (holder.positions.code === "direktur_utama") {
      const { count } = await admin
        .from("position_holders")
        .select("id", { count: "exact", head: true })
        .eq("position_id", holder.position_id)
        .is("ended_at", null);
      if ((count ?? 0) <= 1) throw new ActionError("Direktur Utama harus selalu terisi.");
      if (!ctx.roles.includes("owner")) {
        throw new ActionError("Jabatan Direktur Utama hanya bisa diatur oleh Direktur Utama.");
      }
    }
    const { error } = await admin
      .from("position_holders")
      .update({ ended_at: today() })
      .eq("id", holder.id);
    if (error) throw new Error(`Pemegang jabatan gagal dilepas: ${error.message}`);
    return { ok: true as const };
  });

export const setDelegateAction = adminActionClient
  .inputSchema(delegateSchema)
  .action(async ({ parsedInput }) => {
    const admin = createSupabaseAdminClient();
    const target = parsedInput.delegateToId === "atasan" ? null : parsedInput.delegateToId;
    if (target === parsedInput.positionId) throw new ActionError("Pilih jabatan lain.");
    if (target) {
      const { data: back } = await admin
        .from("positions")
        .select("delegate_to_id")
        .eq("id", target)
        .maybeSingle();
      if (back?.delegate_to_id === parsedInput.positionId) {
        throw new ActionError("Jabatan itu sudah melimpahkan tugasnya ke jabatan ini.");
      }
    }
    const { error } = await admin
      .from("positions")
      .update({ delegate_to_id: target })
      .eq("id", parsedInput.positionId)
      .neq("code", "direktur_utama");
    if (error) throw new Error(`Pelimpahan gagal disimpan: ${error.message}`);
    return { ok: true as const };
  });
