import { RoofLine } from "@/components/shared/roof-line";

/**
 * Kerangka memuat portal: bentuknya mengikuti halaman (kartu sapaan lalu kartu-kartu), berkilau
 * halus, dengan garis atap KIS yang tergambar berulang dan teks singkat. Tidak terasa macet.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman" className="grid gap-5">
      <div className="h-44 shimmer rounded-[2rem] sm:h-52" />
      <div className="grid gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex h-28 shimmer items-start gap-4 rounded-3xl p-5" />
        ))}
      </div>
      <p className="mx-auto mt-2 flex items-center gap-2.5 text-sm font-semibold text-subtle-foreground">
        <RoofLine strokeWidth={3} className="roof-draw h-4 w-10 text-primary-600" />
        Sebentar, sedang memuat
      </p>
    </div>
  );
}
