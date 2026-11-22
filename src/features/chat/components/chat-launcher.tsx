"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CHAT_ASSISTANT } from "@/config/chat";
import { Loading03Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

const ChatPanel = dynamic(() => import("./chat-panel").then((module) => module.ChatPanel), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Membuka chat"
      className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <Icon icon={Loading03Icon} aria-hidden="true" className="size-6 animate-spin" />
    </div>
  ),
});

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  return (
    <>
      {open ? null : (
        <button
          type="button"
          onClick={() => {
            setMounted(true);
            setOpen(true);
          }}
          className="fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:scale-105 motion-safe:animate-[float-in_400ms_ease-out] sm:w-auto sm:pr-5 sm:pl-4"
        >
          <Icon icon={WhatsappIcon} aria-hidden="true" className="size-6" />
          <span className="sr-only sm:not-sr-only">Tanya {CHAT_ASSISTANT.name}</span>
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
