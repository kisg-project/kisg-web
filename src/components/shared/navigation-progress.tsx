"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Klik yang membuka halaman lain di aplikasi yang sama (bukan tab baru, unduhan, atau situs lain). */
function internalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  if (!anchor?.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin && url.pathname !== window.location.pathname;
}

/**
 * Bilah progres tipis di atas layar selama perpindahan halaman, supaya ketukan langsung terasa
 * ditanggapi walau server masih menyiapkan halaman. Muncul saat tautan internal diketuk dan hilang
 * begitu path berubah.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  // Path saat tautan diketuk. Selama path masih sama, halaman tujuan belum tampil.
  const [from, setFrom] = useState<string | null>(null);
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    // Path berubah: navigasi selesai (pola state turunan React, tanpa efek).
    setSeenPath(pathname);
    setFrom(null);
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (internalNavigation(event)) setFrom(window.location.pathname);
    };
    const onPopState = () => {
      setFrom(null);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (from === null) return null;
  return (
    <div
      role="progressbar"
      aria-label="Memuat halaman"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden"
    >
      <div className="nav-progress h-full origin-left rounded-r-full bg-highlight shadow-[0_0_12px_rgb(215_174_95/0.8)]" />
    </div>
  );
}
