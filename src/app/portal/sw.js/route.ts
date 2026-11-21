import type { NextRequest } from "next/server";
import { portalBase } from "@/features/pwa/base-path";
import { serviceWorkerSource } from "@/features/pwa/service-worker";

/**
 * Service worker portal. Disajikan dari route supaya scope mengikuti host: "/" di subdomain portal,
 * "/portal/" di host lain. Header Service-Worker-Allowed mengizinkan scope itu.
 */
export function GET(request: NextRequest) {
  const base = portalBase(request.headers.get("host"), process.env.PORTAL_HOST);
  return new Response(serviceWorkerSource(base), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": `${base}/`,
      // Browser selalu memeriksa versi terbaru service worker.
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
