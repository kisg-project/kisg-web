import { z } from "zod";
import { APPROVAL_DECISIONS } from "@/config/approvals";
import { signatureSchema } from "@/features/approvals";

const kind = z.enum(["masuk", "pulang"]);
const coordinate = {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100_000),
};
const photoPath = z
  .string()
  .regex(
    /^[0-9a-f-]{36}\/[0-9]{4}-[0-9]{2}-[0-9]{2}\/[\w-]+\.(webp|jpg)$/,
    "Foto absensi tidak valid.",
  );

export const clockSchema = z.object({ kind, ...coordinate, photoPath });

export const exceptionSchema = z.object({
  kind,
  ...coordinate,
  photoPath,
  reason: z
    .string({ error: "Tulis alasan absen di luar lokasi." })
    .trim()
    .min(10, "Alasan minimal 10 karakter. Contoh: survei lokasi calon pembeli di Cikarang.")
    .max(500, "Alasan maksimal 500 karakter."),
});

export const workLocationSchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string({ error: "Isi nama titik." })
      .trim()
      .min(3, "Nama titik minimal 3 karakter.")
      .max(80),
    kind: z.enum(["kantor", "proyek"], { error: "Pilih jenis titik." }),
    projectId: z.uuid().nullable().optional(),
    lat: z
      .number({ error: "Isi lintang." })
      .min(-90, "Lintang tidak valid.")
      .max(90, "Lintang tidak valid."),
    lng: z
      .number({ error: "Isi bujur." })
      .min(-180, "Bujur tidak valid.")
      .max(180, "Bujur tidak valid."),
    radiusM: z
      .number({ error: "Isi radius." })
      .int("Radius harus bilangan bulat.")
      .min(10, "Radius minimal 10 meter.")
      .max(1000, "Radius maksimal 1.000 meter."),
    isActive: z.boolean(),
  })
  .refine((value) => value.kind !== "proyek" || Boolean(value.projectId), {
    path: ["projectId"],
    message: "Pilih proyek untuk titik jenis proyek.",
  });

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:MM, contoh 08:00.");

export const scheduleSchema = z
  .object({
    scope: z.enum(["perusahaan", "lokasi", "karyawan"]),
    targetId: z.uuid().nullable().optional(),
    startTime: time,
    endTime: time,
    workdays: z.array(z.number().int().min(1).max(7)).min(1, "Pilih minimal satu hari kerja."),
    lateToleranceMin: z
      .number({ error: "Isi toleransi terlambat." })
      .int()
      .min(0, "Toleransi minimal 0 menit.")
      .max(180, "Toleransi maksimal 180 menit."),
  })
  .refine((value) => value.endTime > value.startTime, {
    path: ["endTime"],
    message: "Jam pulang harus setelah jam masuk.",
  })
  .refine((value) => value.scope === "perusahaan" || Boolean(value.targetId), {
    path: ["targetId"],
    message: "Pilih titik absensi atau karyawan.",
  });

export const deleteScheduleSchema = z.object({ id: z.uuid() });

export type WorkLocationInput = z.input<typeof workLocationSchema>;
export type ScheduleInput = z.input<typeof scheduleSchema>;

/** Lampiran laporan harian yang sudah diunggah ke work-attachments/<user>/<tanggal>/. */
export const workAttachmentSchema = z.object({
  path: z
    .string()
    .regex(
      /^[0-9a-f-]{36}\/[0-9]{4}-[0-9]{2}-[0-9]{2}\/[\w-]+\.(webp|jpg|pdf|docx|xlsx)$/,
      "Lampiran tidak valid.",
    ),
  name: z.string().trim().min(1).max(120),
  type: z.string().max(120),
  size: z
    .number()
    .int()
    .min(1)
    .max(2 * 1024 * 1024),
});

export const workReportSchema = z.object({
  kind: z.enum(["rencana", "hasil"]),
  content: z
    .string({ error: "Tulis isinya dulu." })
    .trim()
    .min(10, "Tulis minimal 10 karakter.")
    .max(4000, "Maksimal 4.000 karakter."),
  attachments: z.array(workAttachmentSchema).max(10, "Lampiran maksimal 10 file."),
});

export type WorkAttachment = z.infer<typeof workAttachmentSchema>;
export type WorkReportInput = z.input<typeof workReportSchema>;

/** Keputusan pengajuan absen di luar lokasi, ditandatangani dengan password penyetuju. */
export const decideExceptionSchema = signatureSchema
  .extend({
    id: z.uuid(),
    decision: z.enum(APPROVAL_DECISIONS),
    note: z.string().trim().max(500, "Catatan maksimal 500 karakter.").optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "ditolak" && (value.note?.length ?? 0) < 5) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Tulis alasan penolakan minimal 5 karakter.",
      });
    }
  });

export type DecideExceptionInput = z.input<typeof decideExceptionSchema>;
