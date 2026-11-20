"use client";

import { useEffect, useRef } from "react";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      appearance?: "always" | "execute" | "interaction-only";
      language?: string;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile gagal dimuat."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile (invisible kecuali perlu interaksi). Skrip baru dimuat saat form tampil,
 * supaya tidak membebani halaman. Tanpa site key (belum diatur), komponen tidak merender apa pun.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
}: {
  siteKey: string | undefined;
  onToken: (token: string | undefined) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!siteKey || !element) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId = window.turnstile.render(element, {
          sitekey: siteKey,
          appearance: "interaction-only",
          language: "id",
          callback: onToken,
          "expired-callback": () => {
            onToken(undefined);
          },
          "error-callback": () => {
            onToken(undefined);
          },
        });
      })
      .catch(() => {
        onToken(undefined);
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="min-h-0" />;
}
