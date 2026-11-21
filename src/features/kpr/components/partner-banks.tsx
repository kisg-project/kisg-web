import Image from "next/image";
import { PARTNER_BANKS } from "@/config/banks";
import { cn } from "@/lib/utils";

/** Logo bank rekanan KPR. SVG dipakai apa adanya (unoptimized). Bank tanpa logo tampil sebagai nama. */
export function PartnerBanks({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-5 shadow-xs ring-1 ring-primary-100/60 sm:p-6",
        className,
      )}
    >
      <h3 className="text-base font-bold">Bank rekanan KPR</h3>
      <ul aria-label="Bank rekanan KPR" className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {PARTNER_BANKS.map((bank) => (
          <li
            key={bank.key}
            className="flex h-20 lift items-center justify-center rounded-2xl border border-neutral-100 bg-white px-4 text-center"
          >
            {bank.logo ? (
              <Image
                src={bank.logo.src}
                alt={bank.name}
                width={bank.logo.width}
                height={bank.logo.height}
                unoptimized
                className="h-10 w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-primary-800">{bank.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
