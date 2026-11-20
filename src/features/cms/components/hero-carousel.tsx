"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  label: string;
  /** Gambar sudah disiapkan di server (getImageProps), termasuk srcSet desktop dan HP. */
  image: {
    desktopSrcSet: string | undefined;
    mobileSrcSet: string | undefined;
    src: string;
    sizes: string | undefined;
    alt: string;
  };
  content: ReactNode;
}

const INTERVAL_MS = 7000;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

/**
 * Hero Banner beranda: beberapa slide yang bergeser otomatis dengan transisi pudar dan zoom halus.
 * Kontrolnya hanya indikator kecil (keputusan owner). Autoplay berhenti saat kursor atau fokus ada di
 * dalam, berhenti permanen begitu pengunjung memilih slide lewat indikator atau tombol panah keyboard
 * (mekanisme jeda WCAG 2.2.2), dan tidak jalan kalau pengunjung mematikan animasi. Slide nonaktif
 * ditandai inert supaya tautannya tidak terjangkau.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  // true setelah pengunjung memilih slide sendiri: autoplay tidak dilanjutkan lagi.
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = slides.length;
  const autoplay = count > 1 && !stopped && !hovered && !reducedMotion;

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => {
      go(index + 1);
    }, INTERVAL_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [autoplay, go, index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner utama"
      className="relative isolate h-hero min-h-[28rem] overflow-hidden bg-primary-950"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onFocus={() => {
        setHovered(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          setStopped(true);
          go(index + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <div aria-live={autoplay ? "off" : "polite"}>
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${String(slideIndex + 1)} dari ${String(count)}: ${slide.label}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-out",
                active ? "z-10 opacity-100" : "z-0 opacity-0",
              )}
            >
              <picture>
                <source
                  media="(min-width: 768px), (orientation: landscape)"
                  srcSet={slide.image.desktopSrcSet}
                  sizes={slide.image.sizes}
                />
                <source srcSet={slide.image.mobileSrcSet} sizes={slide.image.sizes} />
                <img
                  src={slide.image.src}
                  alt={slide.image.alt}
                  sizes={slide.image.sizes}
                  fetchPriority={slideIndex === 0 ? "high" : "low"}
                  loading={slideIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={cn(
                    "absolute inset-0 -z-20 size-full object-cover object-[50%_60%] transition-transform duration-[8000ms] ease-out",
                    active ? "scale-105" : "scale-100",
                  )}
                />
              </picture>
              {/* Lapisan gelap di bagian bawah supaya teks putih terbaca di atas foto. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-primary-950/90 via-primary-950/45 to-primary-950/0"
              />
              <div
                className={cn(
                  "h-full transition-[opacity,translate] delay-200 duration-700 ease-out",
                  active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                )}
              >
                {slide.content}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-20 mx-auto flex w-full max-w-7xl items-center px-4 sm:bottom-5 sm:px-6 lg:px-8">
          <div className="flex items-center rounded-full bg-primary-950/35 px-1.5">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Tampilkan banner ${String(slideIndex + 1)}`}
                aria-current={slideIndex === index ? "true" : undefined}
                onClick={() => {
                  setStopped(true);
                  go(slideIndex);
                }}
                className="group flex h-11 min-w-6 items-center justify-center px-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1.5 rounded-full transition-[width,background-color] duration-300",
                    slideIndex === index
                      ? "w-6 bg-gold-300"
                      : "w-1.5 bg-white/70 group-hover:bg-white",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
