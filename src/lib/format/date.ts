// Semua waktu disimpan UTC (timestamptz) dan ditampilkan dalam Asia/Jakarta (CLAUDE.md bagian 5).

const TIME_ZONE = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDate(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) throw new RangeError("Tanggal tidak valid.");
  return date;
}

/** "19 November 2026" */
export function formatDateWIB(value: Date | string): string {
  return dateFormatter.format(toDate(value));
}

/** "14.30 WIB" */
export function formatTimeWIB(value: Date | string): string {
  return `${timeFormatter.format(toDate(value)).replace(":", ".")} WIB`;
}

/** "19 November 2026, 14.30 WIB" */
export function formatDateTimeWIB(value: Date | string): string {
  const date = toDate(value);
  return `${formatDateWIB(date)}, ${formatTimeWIB(date)}`;
}

/** Tanggal kalender di Jakarta dalam format YYYY-MM-DD, untuk kolom `date` (misal tanggal laporan). */
export function toJakartaDateString(value: Date | string): string {
  return isoDateFormatter.format(toDate(value));
}
