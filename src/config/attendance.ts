// Aturan absensi (CLAUDE.md bagian 8, keputusan owner 20 November 2026). Nilai di database tetap
// pengaman utama (radius per titik absensi, waktu dari server).

/** Radius default titik absensi baru (meter). */
export const DEFAULT_RADIUS_M = 100;

/** GPS lebih kasar dari ini dianggap belum akurat: karyawan diminta menunggu sinyal lebih baik. */
export const MAX_GPS_ACCURACY_M = 150;

/** Deteksi wajah: lebar wajah minimal terhadap lebar gambar, supaya foto dari jauh ditolak. */
export const MIN_FACE_WIDTH_RATIO = 0.25;

/** Skor kedip (blendshape MediaPipe) untuk mata tertutup dan terbuka lagi. */
export const BLINK_CLOSED = 0.5;
export const BLINK_OPEN = 0.25;

/** Batas waktu menunggu kedip sebelum karyawan diminta mencoba lagi (milidetik). */
export const BLINK_TIMEOUT_MS = 20_000;

export const ATTENDANCE_KIND_LABEL = { masuk: "Clock in", pulang: "Clock out" } as const;
export type AttendanceKind = keyof typeof ATTENDANCE_KIND_LABEL;

/** Hari kerja ISO (1 Senin sampai 7 Minggu). */
export const WEEKDAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
] as const;

/** Role yang wajib absensi dan laporan harian (sama dengan private.must_attend di database). */
export const ATTENDANCE_ROLES = [
  "admin",
  "marketing_manager",
  "marketing",
  "site_manager",
  "site_supervisor",
  "finance",
] as const;

export function mustAttend(roles: readonly string[]): boolean {
  return (
    roles.some((role) => (ATTENDANCE_ROLES as readonly string[]).includes(role)) &&
    !roles.includes("owner")
  );
}

/** Laporan harian (keputusan owner, 20 November 2026): rencana setelah clock in, hasil setelah clock out. */
export const WORK_REPORT = {
  minChars: 10,
  maxChars: 4000,
  maxFiles: 10,
  /** Batas keras server dan bucket work-attachments. Foto dikompres di HP ke 300 KB. */
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
