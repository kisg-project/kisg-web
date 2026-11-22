"use client";

import { useSyncExternalStore } from "react";

const FORMAT = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const subscribe = (callback: () => void) => {
  const timer = window.setInterval(callback, 1000);
  return () => {
    window.clearInterval(timer);
  };
};

const now = () => FORMAT.format(new Date()).replaceAll(".", ":");

export function LiveClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, now, () => "--:--:--");
  return (
    <time suppressHydrationWarning className={className}>
      {time}
    </time>
  );
}
