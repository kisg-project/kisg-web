"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker portal. Scope mengikuti alamat: "/" di subdomain, "/portal/" di host lain. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = window.location.pathname.startsWith("/portal") ? "/portal" : "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
      // Tanpa service worker portal tetap berjalan, hanya tanpa halaman offline.
    });
  }, []);
  return null;
}
