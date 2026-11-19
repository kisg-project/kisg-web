import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPR_DEFAULTS } from "@/config/kpr";
import { KPR_PRODUCTS, lowestRate, type KprProduct } from "@/config/kpr-products";
import { formatRupiah } from "@/lib/format";
import { calculateKpr, downPaymentFromPercent } from "../utils/calculate";
import { PartnerBanks } from "./partner-banks";

/** Angsuran periode pertama untuk produk dengan bunga atau margin terendah, DP dan tenor default. */
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

/** Ringkasan simulasi di beranda, menaut ke halaman simulasi lengkap. */
export function KprTeaser({ price }: { price: number }) {
  const lowest = lowestInstallment(price);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        {lowest ? (
          <>
            <p className="text-sm text-subtle-foreground">Angsuran mulai</p>
            <p className="text-3xl font-extrabold text-primary tabular">
              {formatRupiah(lowest.monthly)}
              <span className="text-base font-semibold text-subtle-foreground"> per bulan</span>
            </p>
            <p className="mt-1 text-sm text-subtle-foreground">
              {lowest.product.name}, uang muka {KPR_DEFAULTS.downPaymentPercent}%,{" "}
              {Math.max(lowest.product.tenor.min, KPR_DEFAULTS.tenorYears)} tahun, periode awal.
            </p>
          </>
        ) : null}
      </div>
      <Button asChild size="lg">
        <Link href="/simulasi-kpr">
          Hitung simulasi lengkap
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
      <PartnerBanks className="lg:col-span-2" />
    </div>
  );
}
