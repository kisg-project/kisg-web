"use client";

import { useEffect } from "react";
import { readTracking, shouldReplace, trackingFromUrl, writeTracking } from "../utils/tracking";

/** Mencatat sumber kunjungan (UTM, fbclid, referrer) sekali saat halaman website dibuka. */
export function TrackingCapture() {
  useEffect(() => {
    const next = trackingFromUrl(new URL(window.location.href), document.referrer);
    const stored = readTracking() ?? null;
    if (!shouldReplace(next, stored)) return;
    const visitorId = stored?.visitorId ?? crypto.randomUUID();
    writeTracking({ ...next, visitorId });
  }, []);
  return null;
}
