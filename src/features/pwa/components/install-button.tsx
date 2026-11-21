"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Tombol "Pasang aplikasi" di portal. Hanya tampil kalau browser mendukung pemasangan (Chrome, Edge,
 * Samsung Internet) dan aplikasi belum terpasang. Di iPhone pemasangan lewat menu Bagikan, lalu
 * "Tambahkan ke Layar Utama".
 */
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
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        void prompt.prompt().then(() => {
          setPrompt(null);
        });
      }}
    >
      <Download aria-hidden="true" />
      <span className="hidden sm:inline">Pasang aplikasi</span>
      <span className="sm:hidden">Pasang</span>
    </Button>
  );
}
