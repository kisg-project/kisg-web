import { cn } from "@/lib/utils";

/**
 * Garis atap dari logo KIS (satu puncak, sisi kanan lebih panjang). Dipakai sebagai motif di hero,
 * judul halaman, dan panel ajakan. Hanya dekorasi, disembunyikan dari pembaca layar.
 */
export function RoofLine({
  className,
  strokeWidth = 6,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 120"
      fill="none"
      preserveAspectRatio="none"
      className={cn("pointer-events-none", className)}
    >
      <polyline
        points="4,116 168,6 396,84"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
