"use client";

import { useEffect } from "react";

export function BodyClass({ className }: { className: string }) {
  useEffect(() => {
    const names = className.split(" ").filter(Boolean);
    document.body.classList.add(...names);
    return () => {
      document.body.classList.remove(...names);
    };
  }, [className]);
  return null;
}
