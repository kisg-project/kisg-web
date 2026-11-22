import Image from "next/image";
import { officeMapsUrl } from "@/config/site";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

const MARKER = { left: "26.62%", top: "71.37%" } as const;

export function OfficeMap() {
  return (
    <a href={officeMapsUrl()} target="_blank" rel="noopener noreferrer" className="group block">
      <span className="sr-only">Buka lokasi kantor pemasaran di Google Maps</span>
      <div className="relative aspect-[1000/373] w-full">
        <Image
          src="/images/map/indonesia-dots.svg"
          alt=""
          width={1000}
          height={373}
          unoptimized
          className="size-full opacity-35 transition-opacity duration-500 group-hover:opacity-55"
        />
        <span
          aria-hidden="true"
          className="absolute size-0"
          style={{ left: MARKER.left, top: MARKER.top }}
        >
          <span className="absolute -top-5 -left-5 size-10 animate-ping rounded-full bg-gold-400/50 motion-reduce:animate-none" />
          <span className="absolute -top-2 -left-2 size-4 rounded-full border-2 border-white bg-gold-400 shadow-[0_0_16px_4px_rgb(215_174_95/0.6)]" />
          <span className="absolute top-3 left-3 rounded-md bg-white px-2 py-1 text-xs font-semibold whitespace-nowrap text-primary-900 shadow-md">
            Kantor KIS, Bekasi
          </span>
        </span>
      </div>
      <span className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-white underline-offset-4 group-hover:underline">
        Petunjuk arah
        <Icon icon={ArrowUpRight01Icon} aria-hidden="true" className="size-4" />
      </span>
    </a>
  );
}
