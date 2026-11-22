"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  CHAT_ASSISTANT,
  CHAT_GREETING,
  CHAT_LIMITS,
  CHAT_SUGGESTIONS,
  CHAT_UNAVAILABLE,
} from "@/config/chat";
import { whatsappLink } from "@/config/site";
import { TurnstileWidget } from "@/features/leads";
import { cn } from "@/lib/utils";
import {
  ArrowExpand01Icon,
  ArrowShrink02Icon,
  Call02Icon,
  Cancel01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

type ChatMessage = UIMessage<{ fallback?: boolean }>;

export function pageWhatsappLink(): string {
  const page = document.title.split("|")[0]?.trim() || "website";
  return whatsappLink(
    `Halo, saya dari halaman ${page} (${window.location.href}). Saya ingin bertanya.`,
  );
}

function WhatsappButton({
  href,
  label = "Lanjut lewat WhatsApp",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-full bg-success-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-success-800"
    >
      <Icon icon={Call02Icon} aria-hidden="true" className="size-4" />
      {label}
    </a>
  );
}

function Bubble({ from, children }: { from: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", from === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-3xl px-4 py-2.5 text-[0.95rem] leading-relaxed whitespace-pre-wrap",
          from === "user"
            ? "rounded-br-lg bg-primary-800 text-white"
            : "rounded-bl-lg bg-surface text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function MessageView({ message }: { message: ChatMessage }) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  const handoff = message.parts.find(
    (part) => part.type === "tool-handoff_to_human" && part.state === "output-available",
  );
  const handoffUrl =
    handoff && "output" in handoff
      ? (handoff.output as { whatsappUrl?: string } | undefined)?.whatsappUrl
      : undefined;
  if (!text && !handoffUrl) return null;
  return (
    <div>
      {text ? <Bubble from={message.role === "user" ? "user" : "assistant"}>{text}</Bubble> : null}
      {message.role === "assistant" && (handoffUrl ?? message.metadata?.fallback) ? (
        <WhatsappButton href={handoffUrl ?? pageWhatsappLink()} />
      ) : null}
    </div>
  );
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [chatId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const { messages, sendMessage, status, error, clearError } = useChat<ChatMessage>({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: all, id, body }) => ({
        body: { ...body, id, message: all[all.length - 1] },
      }),
    }),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    if (error) clearError();
    void sendMessage(
      { text: clean.slice(0, CHAT_LIMITS.maxMessageChars) },
      { body: { pagePath: window.location.pathname, turnstileToken } },
    );
    setInput("");
  }

  return (
    <div
      role="dialog"
      aria-label={`Chat dengan ${CHAT_ASSISTANT.name}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden bg-background shadow-lg ring-1 ring-primary-100",
        "inset-0 pt-safe pb-safe sm:pt-0 sm:pb-0",
        fullscreen
          ? "sm:inset-4 sm:rounded-4xl"
          : "sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(40rem,calc(100dvh-2.5rem))] sm:w-[26rem] sm:rounded-4xl",
      )}
    >
      <header className="flex items-center gap-3 border-b border-primary-100 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-900 text-base font-bold text-gold-300"
        >
          J
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-primary-950">{CHAT_ASSISTANT.name}</p>
          <p className="truncate text-xs text-muted-foreground">{CHAT_ASSISTANT.role}</p>
        </div>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat marketing lewat WhatsApp"
          onClick={(event) => {
            event.currentTarget.href = pageWhatsappLink();
          }}
          className="flex size-10 items-center justify-center rounded-full text-success-700 transition-colors hover:bg-success-50"
        >
          <Icon icon={Call02Icon} aria-hidden="true" className="size-5" />
        </a>
        <button
          type="button"
          onClick={() => {
            setFullscreen((value) => !value);
          }}
          aria-label={fullscreen ? "Kecilkan chat" : "Layar penuh"}
          className="hidden size-10 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-surface sm:flex"
        >
          {fullscreen ? (
            <Icon icon={ArrowShrink02Icon} aria-hidden="true" className="size-5" />
          ) : (
            <Icon icon={ArrowExpand01Icon} aria-hidden="true" className="size-5" />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup chat"
          className="flex size-10 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-surface"
        >
          <Icon icon={Cancel01Icon} aria-hidden="true" className="size-5" />
        </button>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Percakapan"
        className={cn("flex-1 space-y-3 overflow-y-auto px-4 py-4", fullscreen && "sm:px-10")}
      >
        <Bubble from="assistant">{CHAT_GREETING}</Bubble>
        {messages.length === 0 ? (
          <ul aria-label="Saran pertanyaan" className="flex flex-wrap gap-2 pt-1">
            {CHAT_SUGGESTIONS.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => {
                    send(suggestion);
                  }}
                  className="min-h-10 rounded-full border border-primary-200 bg-white px-3.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {messages.map((message) => (
          <MessageView key={message.id} message={message} />
        ))}
        {status === "submitted" ? (
          <div className="flex justify-start" aria-label={`${CHAT_ASSISTANT.name} sedang mengetik`}>
            <span className="flex gap-1 rounded-3xl rounded-bl-lg bg-surface px-4 py-3.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-2 animate-bounce rounded-full bg-primary-400"
                  style={{ animationDelay: `${String(dot * 150)}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}
        {error ? (
          <div>
            <Bubble from="assistant">{CHAT_UNAVAILABLE}</Bubble>
            <WhatsappButton href={pageWhatsappLink()} />
          </div>
        ) : null}
      </div>

      <form
        className="border-t border-primary-100 px-3 pt-3 pb-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        {siteKey && messages.length === 0 ? (
          <TurnstileWidget siteKey={siteKey} onToken={setTurnstileToken} />
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Tulis pesan untuk {CHAT_ASSISTANT.name}
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={CHAT_LIMITS.maxMessageChars}
            placeholder="Tulis pertanyaan Anda"
            onChange={(event) => {
              setInput(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-input bg-background px-4 py-2.5 text-base"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Kirim pesan"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <Icon icon={SentIcon} aria-hidden="true" className="size-5" />
          </button>
        </div>
        <p className="mt-2 px-1 text-[0.72rem] text-muted-foreground">
          {CHAT_ASSISTANT.name} adalah asisten virtual. Percakapan disimpan untuk layanan.{" "}
          <Link href="/kebijakan-privasi" className="font-semibold underline underline-offset-2">
            Kebijakan privasi
          </Link>
        </p>
      </form>
    </div>
  );
}
