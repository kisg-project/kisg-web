import type { NextRequest } from "next/server";
import { portalBase, portalManifest } from "@/features/pwa/base-path";

/** Manifest PWA portal. Dibuat per request karena start_url mengikuti host (subdomain atau /portal). */
export function GET(request: NextRequest) {
  const base = portalBase(request.headers.get("host"), process.env.PORTAL_HOST);
  return Response.json(portalManifest(base), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
