// Harus sama dengan enum Postgres unit_status (docs/data-model.md).
// Warna mengikuti docs/brand.md bagian "Status unit".

export const UNIT_STATUSES = ["tersedia", "hold", "booking", "terjual"] as const;

export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const UNIT_STATUS_META: Record<
  UnitStatus,
  { label: string; tone: "success" | "warning" | "info" | "danger"; hatched: boolean }
> = {
  tersedia: { label: "Tersedia", tone: "success", hatched: false },
  hold: { label: "Hold", tone: "warning", hatched: false },
  booking: { label: "Booking", tone: "info", hatched: true },
  terjual: { label: "Terjual", tone: "danger", hatched: true },
};
