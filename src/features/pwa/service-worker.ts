// Isi service worker portal, ditulis manual (Serwist belum mendukung Turbopack yang dipakai build
// Next 16, CLAUDE.md bagian 3). Strategi sengaja sederhana dan aman untuk data karyawan:
// - halaman portal: selalu dari jaringan; kalau offline, tampilkan halaman offline yang sudah disimpan
// - aset build (/_next/static, ikon): simpan dan pakai dari cache (nama file berisi hash)
// - data, server action, dan semua request selain GET: tidak pernah di-cache
// Antrian laporan offline (Dexie) ditambah di Fase 8.

export const SW_VERSION = "2026-11-20-1";

export function serviceWorkerSource(base: string): string {
  const offlineUrl = `${base}/offline`;
  return `
const VERSION = ${JSON.stringify(SW_VERSION)};
const STATIC_CACHE = "kis-portal-static-" + VERSION;
const PAGE_CACHE = "kis-portal-pages-" + VERSION;
const OFFLINE_URL = ${JSON.stringify(offlineUrl)};
const PRECACHE = [OFFLINE_URL, "/brand/pwa-192.png", "/brand/pwa-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("kis-portal-") && key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error()),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
`;
}
