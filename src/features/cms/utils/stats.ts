import { z } from "zod";

/** Satu angka di strip statistik beranda (site_settings key "stats.home"). */
export interface HomeStat {
  value: number;
  label: string;
  suffix?: string;
  /** false untuk angka yang tidak pantas dihitung naik, misal tahun. */
  countUp: boolean;
}

const statSchema = z.object({
  value: z.number().nonnegative(),
  label: z.string().trim().min(1).max(60),
  suffix: z.string().max(10).optional(),
  countUp: z.boolean().default(true),
});

/** Isi setting yang rusak tidak merusak beranda: item yang tidak valid dilewati. */
export function parseHomeStats(value: unknown): HomeStat[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = statSchema.safeParse(item);
    if (!parsed.success) return [];
    // Satuan m2 ditulis dengan pangkat supaya rapi di layar.
    const suffix = parsed.data.suffix?.replace(/m2$/, "m²");
    return [{ ...parsed.data, ...(suffix ? { suffix } : {}) }];
  });
}
