"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends ComponentProps<"div"> {
  /** Jeda dalam milidetik, untuk efek berurutan pada daftar kartu. */
  delay?: number;
}

/**
 * Isi muncul pelan (fade dan geser naik) saat masuk layar. Hanya elemen yang awalnya di bawah layar
 * yang disembunyikan, dan baru setelah JavaScript jalan, sehingga konten tetap terlihat tanpa JavaScript,
 * LCP tidak tertunda, dan layout tidak bergeser. Gaya ada di utility `reveal` (globals.css).
 */
export function Reveal({ delay = 0, className, style, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    element.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={{ ...style, ["--reveal-delay" as string]: `${String(delay)}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}
