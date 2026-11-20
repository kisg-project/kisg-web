import type { Tracking } from "../schemas/lead";

// Jejak kunjungan pertama (first touch) yang dikirim bersama form lead. Disimpan di localStorage
// browser pengunjung sendiri. Semua akses dibungkus try/catch karena storage bisa diblokir.

export const TRACKING_KEY = "kis_touch";
const UTM_PARAMS = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
  fbclid: "fbclid",
} as const;

/** Mengambil parameter UTM dan fbclid dari URL kunjungan. */
export function trackingFromUrl(url: URL, referrer: string): NonNullable<Tracking> {
  const tracking: NonNullable<Tracking> = { landingPath: url.pathname.slice(0, 300) };
  for (const [param, key] of Object.entries(UTM_PARAMS)) {
    const value = url.searchParams.get(param);
    if (value) tracking[key] = value.slice(0, key === "fbclid" ? 500 : 200);
  }
  if (referrer && !referrer.startsWith(url.origin)) tracking.referrer = referrer.slice(0, 500);
  return tracking;
}

/** Kunjungan dari iklan atau situs lain menimpa jejak lama, kunjungan internal tidak. */
export function shouldReplace(next: NonNullable<Tracking>, stored: Tracking | null): boolean {
  if (!stored) return true;
  return Boolean(next.utmSource ?? next.fbclid ?? next.referrer);
}

export function readTracking(): Tracking {
  try {
    const raw = window.localStorage.getItem(TRACKING_KEY);
    return raw ? (JSON.parse(raw) as Tracking) : undefined;
  } catch {
    return undefined;
  }
}

export function writeTracking(tracking: NonNullable<Tracking>): void {
  try {
    window.localStorage.setItem(TRACKING_KEY, JSON.stringify(tracking));
  } catch {
    // Storage diblokir: form tetap jalan tanpa data sumber kunjungan.
  }
}
