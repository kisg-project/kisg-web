"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { CHAT_ASSISTANT } from "@/config/chat";

// Panel (dan pustaka AI) baru dimuat saat tombol pertama kali ditekan, supaya halaman tetap ringan.
const ChatPanel = dynamic(() => import("./chat-panel").then((module) => module.ChatPanel), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Membuka chat"
      className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
    </div>
  ),
});

/**
 * Satu tombol melayang untuk chat Jaka dan WhatsApp (CLAUDE.md bagian 12): membuka panel chat, dan
 * panel punya tombol WhatsApp. Panel tetap terpasang setelah dibuka, jadi percakapan tidak hilang
 * saat pengunjung pindah halaman atau menutup panel.
 */
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  return (
    <>
      {open ? null : (
        <button
          type="button"
          aria-label={`Chat dengan ${CHAT_ASSISTANT.name}, asisten virtual KIS Group`}
          onClick={() => {
            setMounted(true);
            setOpen(true);
          }}
          className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex h-14 items-center gap-2 rounded-full bg-primary pr-5 pl-4 font-semibold text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:scale-105 motion-safe:animate-[float-in_400ms_ease-out]"
        >
          <MessageCircle aria-hidden="true" className="size-6" />
          <span className="hidden sm:inline">Tanya {CHAT_ASSISTANT.name}</span>
        </button>
      )}
      {mounted ? (
        <div hidden={!open}>
          <ChatPanel
            onClose={() => {
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </>
  );
}
