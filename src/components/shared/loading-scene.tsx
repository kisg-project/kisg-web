import { cn } from "@/lib/utils";
import { LottiePlayer } from "./lottie-player";

/**
 * Layar memuat di tengah layar: animasi Lottie rumah KIS yang terbangun (badan naik, garis atap
 * tergambar, pintu muncul, jendela menyala) lalu berulang. Selama Lottie belum siap, versi SVG dengan
 * animasi CSS (kelas loader-*) yang tampil. Saat prefers-reduced-motion aktif, gambarnya diam.
 */
export function LoadingScene({
  label = "Menyiapkan halaman",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "pointer-events-none fixed inset-0 z-30 grid place-items-center px-4",
        className,
      )}
    >
      <div className="grid justify-items-center gap-5">
        <div className="relative grid size-40 place-items-center">
          <span
            aria-hidden="true"
            className="loader-halo absolute inset-3 rounded-full bg-primary-100 dark:bg-primary-950"
          />
          <LottiePlayer
            name="loading-house"
            className="h-28 w-32"
            fallback={
              <svg
                aria-hidden="true"
                viewBox="0 0 160 140"
                className="loader-house relative h-28 w-32 overflow-visible"
              >
                <ellipse
                  className="loader-shadow fill-neutral-200 dark:fill-neutral-800"
                  cx="80"
                  cy="128"
                  rx="48"
                  ry="3.5"
                />
                <rect
                  className="loader-body fill-primary-100 stroke-neutral-800 dark:fill-primary-900 dark:stroke-neutral-300"
                  x="41"
                  y="64"
                  width="78"
                  height="58"
                  rx="8"
                  strokeWidth="2.6"
                />
                <rect
                  className="loader-window fill-gold-100 stroke-neutral-800 dark:stroke-neutral-300"
                  x="50"
                  y="85"
                  width="16"
                  height="14"
                  rx="3"
                  strokeWidth="2.2"
                />
                <rect
                  className="loader-window loader-window-late fill-gold-100 stroke-neutral-800 dark:stroke-neutral-300"
                  x="94"
                  y="85"
                  width="16"
                  height="14"
                  rx="3"
                  strokeWidth="2.2"
                />
                <rect
                  className="loader-door fill-white stroke-neutral-800 dark:fill-neutral-900 dark:stroke-neutral-300"
                  x="70"
                  y="94"
                  width="20"
                  height="28"
                  rx="5"
                  strokeWidth="2.2"
                />
                <path
                  className="loader-roof stroke-neutral-800 dark:stroke-neutral-300"
                  d="M30 74 L80 32 L130 74"
                  fill="none"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                />
                <path
                  className="loader-roof stroke-gold-200"
                  d="M30 74 L80 32 L130 74"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                />
              </svg>
            }
          />
        </div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {label}
          <span aria-hidden="true" className="flex items-end gap-1 pb-1">
            <span className="loader-dot size-1.5 rounded-full bg-primary-600" />
            <span className="loader-dot size-1.5 rounded-full bg-primary-600 [animation-delay:150ms]" />
            <span className="loader-dot size-1.5 rounded-full bg-primary-600 [animation-delay:300ms]" />
          </span>
        </p>
      </div>
    </div>
  );
}
