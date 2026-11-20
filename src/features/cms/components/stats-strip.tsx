"use client";

import { useEffect, useRef, useState } from "react";
import type { HomeStat } from "../utils/stats";

const DURATION_MS = 1400;

function format(value: number): string {
  return new Intl.NumberFormat("id-ID", { useGrouping: value >= 10_000 }).format(value);
}

/**
 * Angka yang berhitung naik saat masuk layar (keputusan owner, Fase 3). Server merender angka akhir,
 * jadi tanpa JavaScript atau dengan prefers-reduced-motion angka tetap benar dan layout tidak bergeser
 * (lebar dijaga tabular-nums).
 */
function CountUp({ stat }: { stat: HomeStat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(stat.value);

  useEffect(() => {
    const element = ref.current;
    if (!element || !stat.countUp) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    let frame = 0;
    setShown(0);
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - (1 - progress) ** 3;
        setShown(Math.round(stat.value * eased));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [stat.countUp, stat.value]);

  return (
    <span ref={ref} className="tabular">
      {format(shown)}
      {stat.suffix}
    </span>
  );
}

/** Strip statistik beranda. Disembunyikan kalau belum ada angka asli (CLAUDE.md: tanpa data karangan). */
export function StatsStrip({ stats }: { stats: readonly HomeStat[] }) {
  if (stats.length === 0) return null;
  return (
    <section aria-label="KIS Group dalam angka" className="border-b bg-background">
      <dl className="mx-auto grid w-full max-w-7xl grid-cols-1 divide-y px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 py-6 text-center sm:py-8"
          >
            <dt className="order-2 text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="order-1 text-3xl font-extrabold text-primary sm:text-4xl">
              <CountUp stat={stat} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
