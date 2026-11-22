export const SW_VERSION = "2026-11-23-1";

export function serviceWorkerSource(base: string): string {
  const offlineUrl = `${base}/offline`;
  return `
const VERSION = ${JSON.stringify(SW_VERSION)};
const STATIC_CACHE = "kis-portal-static-" + VERSION;
const PAGE_CACHE = "kis-portal-pages-" + VERSION;
const OFFLINE_URL = ${JSON.stringify(offlineUrl)};
const PRECACHE = [OFFLINE_URL, "/brand/pwa-192.png", "/brand/pwa-512.png"];
const BASE = ${JSON.stringify(base)};

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
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = typeof data.title === "string" && data.title ? data.title : "KIS Operasional";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body : "",
      icon: "/brand/pwa-192.png",
      badge: "/brand/pwa-192.png",
      tag: typeof data.tag === "string" ? data.tag : undefined,
      data: { url: typeof data.url === "string" ? data.url : "/portal/notifikasi" },
    }),
  );
});

function publicUrl(href) {
  const valid = (href === "/portal" || href.startsWith("/portal/")) && !href.includes("//");
  const path = valid ? href : "/portal/notifikasi";
  const clean = BASE === "" ? path.slice("/portal".length) || "/" : path;
  return new URL(clean, self.location.origin).href;
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = publicUrl((event.notification.data && event.notification.data.url) || "");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const same = windows.find((client) => client.url === target);
      if (same) return same.focus();
      const open = windows.find((client) => "navigate" in client);
      if (open) return open.navigate(target).then((client) => (client ? client.focus() : undefined));
      return self.clients.openWindow(target);
    }),
  );
});
`;
}
