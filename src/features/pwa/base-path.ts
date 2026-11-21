import { toPublicPath } from "@/config/portal-host";

/** Awalan path portal yang dilihat browser: "" di host portal, "/portal" di host lain. */
export function portalBase(host: string | null, portalHost: string | undefined): string {
  const onPortalHost =
    Boolean(portalHost) &&
    (host ?? "").split(":")[0]?.toLowerCase() === portalHost?.split(":")[0]?.toLowerCase();
  return toPublicPath("/portal", onPortalHost) === "/" ? "" : "/portal";
}

export const PWA_THEME_COLOR = "#0F6D5F";

/** Isi manifest aplikasi portal. start_url dan scope mengikuti host (subdomain atau /portal). */
export function portalManifest(base: string) {
  return {
    name: "KIS Group Operasional",
    short_name: "KIS Operasional",
    description:
      "Aplikasi manajemen operasional bisnis pengembang properti KIS Group: absensi, laporan kerja, CRM, lapangan, keuangan, dan dashboard owner.",
    lang: "id",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: PWA_THEME_COLOR,
    icons: [
      { src: "/brand/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/brand/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
