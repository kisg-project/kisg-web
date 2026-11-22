"use client";

import { useEffect, useState } from "react";
import { Download04Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;
  return (
    <button
      type="button"
      title="Pasang aplikasi"
      onClick={() => {
        void prompt.prompt().then(() => {
          setPrompt(null);
        });
      }}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-(--line-strong) bg-card px-2.5 text-xs font-medium transition-colors hover:bg-neutral-50 motion-safe:active:scale-95 dark:hover:bg-neutral-800"
    >
      <Icon icon={Download04Icon} className="size-[1.125rem]" />
      <span className="sr-only sm:not-sr-only">Pasang aplikasi</span>
    </button>
  );
}
