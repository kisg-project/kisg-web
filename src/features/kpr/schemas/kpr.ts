import { z } from "zod";
import { KPR_LIMITS } from "@/config/kpr";

const { price, downPaymentPercent, tenorYears, ratePercent } = KPR_LIMITS;

const priceField = z
  .number({ error: "Isi harga rumah dalam angka." })
  .int("Harga harus bilangan bulat.")
  .min(price.min, "Harga minimal Rp 50.000.000.")
  .max(price.max, "Harga maksimal Rp 50.000.000.000.");

const downPaymentField = z
  .number({ error: "Isi uang muka dalam angka." })
  .int("Uang muka harus bilangan bulat.")
  .min(0, "Uang muka tidak boleh negatif.");

const tenorField = z
  .number({ error: "Isi tenor dalam tahun." })
  .int("Tenor harus bilangan bulat.")
  .min(tenorYears.min, `Tenor minimal ${tenorYears.min} tahun.`)
  .max(tenorYears.max, `Tenor maksimal ${tenorYears.max} tahun.`);

const rateField = (label: string) =>
  z
    .number({ error: `Isi ${label} dalam persen.` })
    .min(ratePercent.min, `${label} tidak boleh negatif.`)
    .max(ratePercent.max, `${label} maksimal ${ratePercent.max}% per tahun.`);

function checkDownPayment(value: { price: number; downPayment: number }, ctx: z.RefinementCtx) {
  const maxDp = Math.floor((value.price * downPaymentPercent.max) / 100);
  if (value.downPayment > maxDp) {
    ctx.addIssue({
      code: "custom",
      path: ["downPayment"],
      message: `Uang muka maksimal ${downPaymentPercent.max}% dari harga rumah.`,
    });
  }
}

export const kprKonvensionalSchema = z
  .object({
    price: priceField,
    downPayment: downPaymentField,
    tenorYears: tenorField,
    fixedRatePercent: rateField("Bunga fixed"),
    fixedYears: z
      .number({ error: "Isi lama masa fixed dalam tahun." })
      .int("Masa fixed harus bilangan bulat.")
      .min(0, "Masa fixed tidak boleh negatif."),
    floatingRatePercent: rateField("Bunga floating"),
  })
  .superRefine((value, ctx) => {
    checkDownPayment(value, ctx);
    if (value.fixedYears > value.tenorYears) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedYears"],
        message: "Masa fixed tidak boleh lebih lama dari tenor.",
      });
    }
  });

export const kprSyariahSchema = z
  .object({
    price: priceField,
    downPayment: downPaymentField,
    tenorYears: tenorField,
    marginPercent: rateField("Margin"),
  })
  .superRefine(checkDownPayment);

export type KprKonvensionalInput = z.infer<typeof kprKonvensionalSchema>;
export type KprSyariahInput = z.infer<typeof kprSyariahSchema>;
