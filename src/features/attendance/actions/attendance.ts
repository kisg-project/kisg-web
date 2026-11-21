"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/config/portal";
import type { Json } from "@/lib/supabase/database.types";
import { ActionError, adminActionClient, authActionClient } from "@/lib/safe-action";
import {
  clockSchema,
  deleteScheduleSchema,
  exceptionSchema,
  scheduleSchema,
  workReportSchema,
  workLocationSchema,
} from "../schemas/attendance";

/** Pesan dari fungsi database (errcode 22023) sudah ditulis untuk karyawan, jadi ditampilkan apa adanya. */
function rpcError(error: { code?: string; message: string }): Error {
  if (error.code === "22023") return new ActionError(error.message);
  if (error.code === "42501") return new ActionError("Akun ini tidak memakai absensi.");
  return new Error(`Absensi gagal disimpan: ${error.message}`);
}

const clockResult = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    record_id: z.uuid(),
    location_id: z.uuid(),
    distance_m: z.number(),
    late_minutes: z.number(),
    early_minutes: z.number(),
  }),
  z.object({
    status: z.literal("di_luar_radius"),
    nearest_location_id: z.uuid(),
    distance_m: z.number(),
    radius_m: z.number(),
  }),
]);

/**
 * Clock in atau clock out. Jarak ke titik absensi dan waktu dihitung di database (server), bukan di
 * HP. Di luar radius: tidak disimpan, karyawan ditawari pengajuan absen di luar lokasi.
 */
export const clockAction = authActionClient
  .inputSchema(clockSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase.rpc("attendance_clock", {
      p_kind: parsedInput.kind,
      p_lat: parsedInput.lat,
      p_lng: parsedInput.lng,
      p_accuracy: Math.round(parsedInput.accuracy * 10) / 10,
      p_photo_path: parsedInput.photoPath,
    });
    if (error) throw rpcError(error);
    const parsed = clockResult.safeParse(data);
    if (!parsed.success) throw new Error("Respons absensi tidak dikenal.");
    const result = parsed.data;
    let locationName: string | null = null;
    const locationId = result.status === "ok" ? result.location_id : result.nearest_location_id;
    const { data: location } = await ctx.supabase
      .from("work_locations")
      .select("name")
      .eq("id", locationId)
      .maybeSingle();
    locationName = location?.name ?? null;
    return { ...result, locationName };
  });

/** Pengajuan absen di luar lokasi. Disetujui owner atau manajer tim. */
export const requestExceptionAction = authActionClient
  .inputSchema(exceptionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase.rpc("request_attendance_exception", {
      p_kind: parsedInput.kind,
      p_lat: parsedInput.lat,
      p_lng: parsedInput.lng,
      p_accuracy: Math.round(parsedInput.accuracy * 10) / 10,
      p_photo_path: parsedInput.photoPath,
      p_reason: parsedInput.reason,
    });
    if (error) throw rpcError(error);
    return { id: data };
  });

/** Tambah atau ubah titik absensi (kantor atau proyek). Hanya owner. */
export const saveWorkLocationAction = adminActionClient
  .inputSchema(workLocationSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const values = {
      name: input.name,
      kind: input.kind,
      project_id: input.kind === "proyek" ? (input.projectId ?? null) : null,
      lat: Number(input.lat.toFixed(6)),
      lng: Number(input.lng.toFixed(6)),
      radius_m: input.radiusM,
      is_active: input.isActive,
    };
    const result = input.id
      ? await ctx.supabase
          .from("work_locations")
          .update(values)
          .eq("id", input.id)
          .select("id")
          .single()
      : await ctx.supabase
          .from("work_locations")
          .insert({ ...values, created_by: ctx.userId })
          .select("id")
          .single();
    if (result.error) throw new Error(`Titik absensi gagal disimpan: ${result.error.message}`);
    return { id: result.data.id };
  });

/** Simpan jam kerja perusahaan, per titik absensi, atau per karyawan. Hanya owner. */
export const saveScheduleAction = adminActionClient
  .inputSchema(scheduleSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const values = {
      scope: input.scope,
      work_location_id: input.scope === "lokasi" ? (input.targetId ?? null) : null,
      user_id: input.scope === "karyawan" ? (input.targetId ?? null) : null,
      start_time: input.startTime,
      end_time: input.endTime,
      workdays: [...new Set(input.workdays)].sort((a, b) => a - b),
      late_tolerance_min: input.lateToleranceMin,
    };
    let query = ctx.supabase.from("work_schedules").select("id").eq("scope", input.scope);
    if (values.work_location_id) query = query.eq("work_location_id", values.work_location_id);
    if (values.user_id) query = query.eq("user_id", values.user_id);
    const { data: existing } = await query.maybeSingle();
    const result = existing
      ? await ctx.supabase.from("work_schedules").update(values).eq("id", existing.id)
      : await ctx.supabase.from("work_schedules").insert({ ...values, created_by: ctx.userId });
    if (result.error) throw new Error(`Jam kerja gagal disimpan: ${result.error.message}`);
    return { ok: true as const };
  });

/** Hapus jam kerja khusus (titik atau karyawan), kembali ke jam kerja perusahaan. */
export const deleteScheduleAction = adminActionClient
  .inputSchema(deleteScheduleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("work_schedules")
      .delete()
      .eq("id", parsedInput.id)
      .neq("scope", "perusahaan");
    if (error) throw new Error(`Jam kerja gagal dihapus: ${error.message}`);
    return { ok: true as const };
  });

/**
 * Simpan rencana kegiatan (setelah clock in) atau hasil kerja (setelah clock out) hari ini. Aturan
 * dicek fungsi database. Rencana tersimpan: ke beranda role. Hasil tersimpan: ke halaman absensi.
 */
export const submitWorkReportAction = authActionClient
  .inputSchema(workReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase.rpc("submit_work_report", {
      p_kind: parsedInput.kind,
      p_content: parsedInput.content,
      p_attachments: parsedInput.attachments as unknown as Json,
    });
    if (error) throw rpcError(error);
    redirect(parsedInput.kind === "rencana" ? safeNextPath(null, ctx.roles) : "/portal/absensi");
  });
