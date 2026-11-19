import { z } from "zod";
import { KPR_LIMITS } from "@/config/kpr";

const { price, downPaymentPercent, tenorYears, ratePercent, segments } = KPR_LIMITS;

const rateField = (label: string) =>
  z
    .number({ error: `Isi ${label} dalam persen.` })
    .min(ratePercent.min, `${label} tidak boleh negatif.`)
    .max(ratePercent.max, `${label} maksimal ${ratePercent.max}% per tahun.`);

/** Schema form simulasi. `rateLabel` = "Bunga" (konvensional) atau "Margin" (syariah). */
export function kprFormSchema(rateLabel: "Bunga" | "Margin") {
  return z
    .object({
      price: z
        .number({ error: "Isi harga rumah dalam angka." })
        .int("Harga harus bilangan bulat.")
        .min(price.min, "Harga minimal Rp 50.000.000.")
        .max(price.max, "Harga maksimal Rp 50.000.000.000."),
      downPayment: z
        .number({ error: "Isi uang muka dalam angka." })
        .int("Uang muka harus bilangan bulat.")
        .min(0, "Uang muka tidak boleh negatif."),
      tenorYears: z
        .number({ error: "Isi jangka waktu dalam tahun." })
        .int("Jangka waktu harus bilangan bulat.")
        .min(tenorYears.min, `Jangka waktu minimal ${tenorYears.min} tahun.`)
        .max(tenorYears.max, `Jangka waktu maksimal ${tenorYears.max} tahun.`),
      segments: z
        .array(
          z.object({
            ratePercent: rateField(rateLabel),
            years: z
              .number({ error: "Isi lama periode dalam tahun." })
              .int("Lama periode harus bilangan bulat.")
              .min(1, "Lama periode minimal 1 tahun."),
          }),
        )
        .max(segments.max, `Maksimal ${segments.max} periode tetap.`),
      afterRatePercent: rateField(`${rateLabel} setelah periode tetap`),
      npoptkp: z
        .number({ error: "Isi NPOPTKP dalam angka." })
        .int("NPOPTKP harus bilangan bulat.")
        .min(0, "NPOPTKP tidak boleh negatif."),
      otherCostsPercent: z
        .number({ error: "Isi perkiraan biaya dalam persen." })
        .min(0, "Perkiraan biaya tidak boleh negatif.")
        .max(20, "Perkiraan biaya maksimal 20%."),
    })
    .superRefine((value, ctx) => {
      const maxDp = Math.floor((value.price * downPaymentPercent.max) / 100);
      if (value.downPayment > maxDp) {
        ctx.addIssue({
          code: "custom",
          path: ["downPayment"],
          message: `Uang muka maksimal ${downPaymentPercent.max}% dari harga rumah.`,
        });
      }
      const fixedYears = value.segments.reduce((sum, segment) => sum + segment.years, 0);
      if (fixedYears > value.tenorYears) {
        ctx.addIssue({
          code: "custom",
          path: ["segments"],
          message: "Total periode tetap tidak boleh lebih lama dari jangka waktu.",
        });
      }
    });
}

export type KprFormInput = z.infer<ReturnType<typeof kprFormSchema>>;
