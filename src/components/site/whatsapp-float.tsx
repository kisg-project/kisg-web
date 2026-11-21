"use client";

import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/config/site";

/**
 * Tombol WhatsApp melayang. Pesan pembuka menyebut halaman asal supaya marketing tahu konteksnya.
 * Satu-satunya tombol melayang: widget chat (Fase 7) akan digabung ke tombol ini (CLAUDE.md bagian 12).
 */
export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat marketing lewat WhatsApp"
      onClick={(event) => {
        // Judul halaman baru tersedia di browser, jadi pesan disusun saat diklik.
        const page = document.title.split("|")[0]?.trim() || "website";
        event.currentTarget.href = whatsappLink(
          `Halo, saya dari halaman ${page} (${window.location.href}). Saya ingin bertanya.`,
        );
      }}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:scale-105 focus-visible:scale-105 motion-safe:animate-[float-in_400ms_ease-out]"
    >
      <MessageCircle aria-hidden="true" className="size-7" />
    </a>
  );
}
