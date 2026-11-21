"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AnimationItem } from "lottie-web";
import { cn } from "@/lib/utils";

/** Animasi Lottie milik KIS (dibuat scripts/build-lottie.mjs). */
const ANIMATIONS = {
  "loading-house": () => import("@/assets/lottie/loading-house.json"),
  "empty-box": () => import("@/assets/lottie/empty-box.json"),
} as const;

export type LottieName = keyof typeof ANIMATIONS;

/** Player versi ringan (SVG, tanpa eval dan tanpa WASM), aman untuk CSP. Diunduh sekali lalu di-cache. */
const loadPlayer = () => import("lottie-web/build/player/lottie_light");

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Unduh player dan animasi di waktu senggang, supaya layar memuat dan keadaan kosong berikutnya
 * langsung bergerak tanpa menunggu jaringan.
 */
export function prefetchLottie(): void {
  if (prefersReducedMotion()) return;
  void loadPlayer();
  for (const load of Object.values(ANIMATIONS)) void load();
}

/**
 * Memutar animasi Lottie berulang. `fallback` (SVG atau CSS) tampil sampai animasi siap, dan tetap
 * dipakai kalau prefers-reduced-motion aktif atau pemuatan gagal. Animasi dijeda saat tidak terlihat.
 */
export function LottiePlayer({
  name,
  fallback,
  className,
}: {
  name: LottieName;
  fallback: ReactNode;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || prefersReducedMotion()) return;
    let animation: AnimationItem | null = null;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    void Promise.all([loadPlayer(), ANIMATIONS[name]()])
      .then(([player, data]) => {
        if (cancelled) return;
        animation = player.default.loadAnimation({
          container: element,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: structuredClone(data.default),
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: true },
        });
        animation.addEventListener("DOMLoaded", () => {
          if (!cancelled) setReady(true);
        });
        observer = new IntersectionObserver(([entry]) => {
          if (entry?.isIntersecting) animation?.play();
          else animation?.pause();
        });
        observer.observe(element);
      })
      .catch(() => {
        // Gagal memuat: fallback tetap tampil.
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      animation?.destroy();
    };
  }, [name]);

  return (
    <div aria-hidden="true" className={cn("relative", className)}>
      <div
        ref={container}
        className={cn(
          "absolute inset-0 transition-opacity duration-200",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-200",
          ready ? "opacity-0" : "opacity-100",
        )}
      >
        {fallback}
      </div>
    </div>
  );
}
