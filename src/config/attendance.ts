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
