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
                  className="loader-shadow fill-primary-900/15 dark:fill-black/40"
                  cx="80"
                  cy="128"
                  rx="46"
                  ry="5"
                />
                <rect
                  className="loader-body fill-primary-600 dark:fill-primary-500"
                  x="40"
                  y="64"
                  width="80"
                  height="60"
                  rx="10"
                />
                <rect
                  className="loader-window fill-gold-300"
                  x="52"
                  y="78"
                  width="16"
                  height="14"
                  rx="4"
                />
                <rect
                  className="loader-window loader-window-late fill-gold-300"
                  x="92"
                  y="78"
                  width="16"
                  height="14"
                  rx="4"
                />
                <rect
                  className="loader-door fill-white dark:fill-primary-100"
                  x="70"
                  y="96"
                  width="20"
                  height="28"
                  rx="5"
                />
                <path
                  className="loader-roof stroke-gold-400"
                  d="M26 72 L80 28 L134 72"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                />
              </svg>
            }
          />
        </div>
        <p className="flex items-center gap-2 text-base font-semibold text-foreground">
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
