"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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
 * Autoplay bisa dijeda (WCAG 2.2.2), berhenti saat kursor atau fokus ada di dalam, dan tidak jalan
 * kalau pengunjung mematikan animasi. Slide nonaktif ditandai inert supaya tautannya tidak terjangkau.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = slides.length;
  const autoplay = count > 1 && !paused && !hovered && !reducedMotion;

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
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
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
                    "absolute inset-0 -z-20 size-full object-cover transition-transform duration-[8000ms] ease-out",
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
        <div className="absolute inset-x-0 bottom-4 z-20 mx-auto flex w-full max-w-7xl items-center justify-end gap-2 px-4 sm:bottom-6 sm:px-6 lg:px-8">
          <div className="mr-auto flex items-center gap-2 sm:mr-0">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Tampilkan banner ${String(slideIndex + 1)}`}
                aria-current={slideIndex === index ? "true" : undefined}
                onClick={() => {
                  go(slideIndex);
                }}
                className="flex size-11 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1.5 rounded-sm bg-white/60 transition-[width,background-color] duration-300",
                    slideIndex === index ? "w-8 bg-gold-300" : "w-4",
                  )}
                />
              </button>
            ))}
          </div>
          <CarouselButton
            label="Banner sebelumnya"
            onClick={() => {
              go(index - 1);
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </CarouselButton>
          <CarouselButton
            label={paused ? "Putar banner otomatis" : "Jeda banner otomatis"}
            onClick={() => {
              setPaused((value) => !value);
            }}
          >
            {paused ? (
              <Play aria-hidden="true" className="size-5" />
            ) : (
              <Pause aria-hidden="true" className="size-5" />
            )}
          </CarouselButton>
          <CarouselButton
            label="Banner berikutnya"
            onClick={() => {
              go(index + 1);
            }}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </CarouselButton>
        </div>
      ) : null}
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-md border border-white/30 bg-primary-950/40 text-white transition-colors hover:bg-primary-950/70"
    >
      {children}
    </button>
  );
}
