import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KPR_DEFAULTS } from "@/config/kpr";
import { KPR_PRODUCTS, lowestRate, type KprProduct } from "@/config/kpr-products";
import { formatRupiah } from "@/lib/format";
import { calculateKpr, downPaymentFromPercent } from "../utils/calculate";
import { PartnerBanks } from "./partner-banks";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

function lowestInstallment(price: number): { product: KprProduct; monthly: number } | null {
  const product = [...KPR_PRODUCTS].sort((a, b) => lowestRate(a) - lowestRate(b))[0];
  if (!product) return null;
  const result = calculateKpr({
    price,
    downPayment: downPaymentFromPercent(price, KPR_DEFAULTS.downPaymentPercent),
    tenorYears: Math.max(product.tenor.min, KPR_DEFAULTS.tenorYears),
    segments: product.segments,
    afterRatePercent: product.afterRatePercent ?? KPR_DEFAULTS.floatingRatePercent,
  });
  return { product, monthly: result.periods[0]?.monthly ?? 0 };
}

export function KprTeaser({ price }: { price: number }) {
  const lowest = lowestInstallment(price);
  return (
    <div className="grid gap-6 rounded-4xl bg-gold-50 p-6 ring-1 ring-gold-200 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        {lowest ? (
          <>
            <p className="text-sm text-subtle-foreground">Angsuran mulai</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-primary-900 tabular sm:text-5xl">
              {formatRupiah(lowest.monthly)}
              <span
                aria-hidden="true"
                className="ml-1 align-baseline text-base font-semibold tracking-normal text-subtle-foreground sm:text-lg"
              >
                /bulan
              </span>
              <span className="sr-only"> per bulan</span>
            </p>
            <p className="mt-1 text-sm text-subtle-foreground">
              {lowest.product.name}, uang muka {KPR_DEFAULTS.downPaymentPercent}%,{" "}
              {Math.max(lowest.product.tenor.min, KPR_DEFAULTS.tenorYears)} tahun, periode awal.
            </p>
          </>
        ) : null}
      </div>
      <Button asChild size="lg" className="shadow-md">
        <Link href="/simulasi-kpr">
          Hitung simulasi lengkap
          <Icon icon={ArrowRight02Icon} aria-hidden="true" />
        </Link>
      </Button>
      <PartnerBanks className="lg:col-span-2" />
    </div>
  );
}
