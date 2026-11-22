"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const TABLES = [
  "attendance_records",
  "attendance_exceptions",
  "work_reports",
  "work_locations",
  "work_schedules",
  "profiles",
  "user_roles",
  "approval_stamps",
  "notifications",
] as const;

export function LiveRefresh({ url, publishableKey }: { url: string; publishableKey: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(url, publishableKey);
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") router.refresh();
      }, 400);
    };
    const channel = supabase.channel("portal-langsung");
    for (const table of TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    }
    channel.subscribe((status) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- enum REALTIME_SUBSCRIBE_STATES tidak diekspor @supabase/supabase-js
      if (status === "SUBSCRIBED") document.documentElement.setAttribute("data-langsung", "siap");
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      document.documentElement.removeAttribute("data-langsung");
      void supabase.removeChannel(channel);
    };
  }, [url, publishableKey, router]);

  return null;
}
