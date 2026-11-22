"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { Cancel01Icon, ImageAdd01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

function uploadUrl(): string {
  return window.location.pathname.startsWith("/cms") ? "/cms/aset" : "/aset";
}

export function CoverUploader({
  folder,
  value,
  onChange,
  error,
}: {
  folder: "berita" | "lowongan";
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
}) {
  const id = useId();
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setStatus("busy");
    setMessage(null);
    try {
      const compressed = await compressImage(file, "content");
      const body = new FormData();
      body.set("gambar", compressed.file);
      body.set("folder", folder);
      const response = await fetch(uploadUrl(), { method: "POST", body });
      const result = (await response.json().catch(() => null)) as
        { ok: true; url: string } | { ok: false; message: string } | null;
      if (!result?.ok) throw new Error(result?.message ?? "Gambar gagal diunggah. Coba lagi.");
      onChange(result.url);
      setStatus("idle");
    } catch (caught) {
      setStatus("error");
      setMessage(caught instanceof Error ? caught.message : "Gambar gagal diunggah. Coba lagi.");
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">Gambar sampul</span>
      <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-lg border bg-surface">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau di panel CMS, bukan halaman publik
          <img src={value} alt="Pratinjau sampul" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-sm text-subtle-foreground">
            Belum ada sampul
          </span>
        )}
        {status === "busy" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Icon
              icon={Loading03Icon}
              aria-hidden="true"
              className="size-6 animate-spin text-primary"
            />
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={`${id}-file`}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-semibold focus-within:ring-3 focus-within:ring-ring/40 hover:bg-accent",
            status === "busy" && "pointer-events-none opacity-50",
          )}
        >
          <Icon icon={ImageAdd01Icon} aria-hidden="true" className="size-4" />
          {value ? "Ganti sampul" : "Pilih gambar sampul"}
          <input
            id={`${id}-file`}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={status === "busy"}
            onChange={(event) => {
              void handle(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onChange(null);
            }}
          >
            <Icon icon={Cancel01Icon} aria-hidden="true" />
            Hapus sampul
          </Button>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {status === "busy"
          ? "Memperkecil dan mengunggah gambar"
          : "Rasio 16:9 paling pas. Gambar otomatis diperkecil."}
      </p>
      {(message ?? error) ? <p className="text-sm text-destructive">{message ?? error}</p> : null}
    </div>
  );
}
