import { STAFF_ROLES } from "./roles";

export const DEFAULT_RADIUS_M = 100;

export const MAX_GPS_ACCURACY_M = 150;

export const MIN_FACE_WIDTH_RATIO = 0.25;

export const BLINK_CLOSED = 0.5;
export const BLINK_OPEN = 0.25;

export const BLINK_TIMEOUT_MS = 20_000;

export const ATTENDANCE_KIND_LABEL = { masuk: "Clock in", pulang: "Clock out" } as const;
export type AttendanceKind = keyof typeof ATTENDANCE_KIND_LABEL;

export const WEEKDAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
] as const;

export const ATTENDANCE_ROLES = STAFF_ROLES;

export const SCHEDULE_ROLES = STAFF_ROLES.filter((role) => role !== "admin");

export function mustAttend(roles: readonly string[]): boolean {
  return (
    roles.some((role) => (ATTENDANCE_ROLES as readonly string[]).includes(role)) &&
    !roles.includes("owner")
  );
}

export const WORK_REPORT = {
  minChars: 10,
  maxChars: 4000,
  maxFiles: 10,
  maxFileBytes: 2 * 1024 * 1024,
  documentTypes: {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  },
  photoTypes: { "image/webp": "webp", "image/jpeg": "jpg" },
} as const;

export const WORK_REPORT_LABEL = {
  rencana: {
    title: "Rencana kegiatan hari ini",
    field: "Rencana kegiatan",
    hint: "Tulis apa saja yang akan dikerjakan hari ini.",
    submit: "Simpan rencana",
  },
  hasil: {
    title: "Hasil kerja hari ini",
    field: "Hasil kerja",
    hint: "Tulis apa saja yang sudah dikerjakan, kendala, dan rencana lanjutan.",
    submit: "Kirim hasil kerja",
  },
} as const;
export type WorkReportKind = keyof typeof WORK_REPORT_LABEL;
