"use client";

import { useId, useState } from "react";
import { Camera, ImagePlus, LoaderCircle } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { compressImage, cropToSquare, ImageCompressionError } from "@/lib/image";
import { cn } from "@/lib/utils";

type Status = "idle" | "processing" | "uploading" | "done" | "error";

/** Path unggah mengikuti host: /portal/foto-profil di domain utama, /foto-profil di subdomain portal. */
function uploadUrl(): string {
  return window.location.pathname.startsWith("/portal") ? "/portal/foto-profil" : "/foto-profil";
}

/**
 * Foto profil: ambil dari kamera depan atau pilih dari galeri, dipotong persegi, dikompres di browser
 * (src/lib/image, profil "avatar"), lalu diunggah. Status selalu terlihat dan diumumkan ke pembaca layar.
 */
export function AvatarUploader({
  name,
  initialUrl,
  onUploaded,
  error: externalError,
}: {
  name: string;
  initialUrl: string | null;
  onUploaded?: (path: string) => void;
  error?: string;
}) {
  const id = useId();
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const busy = status === "processing" || status === "uploading";

  async function handle(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    try {
      setStatus("processing");
      const square = await cropToSquare(file);
      const compressed = await compressImage(square, "avatar");
      setStatus("uploading");
      const body = new FormData();
      body.set("foto", compressed.file);
      const response = await fetch(uploadUrl(), { method: "POST", body });
      const result = (await response.json().catch(() => null)) as
        { ok: true; path: string; url: string | null } | { ok: false; message: string } | null;
      if (!result?.ok) {
        throw new Error(result?.message ?? "Foto gagal diunggah. Coba lagi.");
      }
      setUrl(result.url ?? URL.createObjectURL(compressed.file));
      setStatus("done");
      setMessage("Foto profil tersimpan.");
      onUploaded?.(result.path);
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof ImageCompressionError || caught instanceof Error
          ? caught.message
          : "Foto gagal diproses. Coba lagi.",
      );
    }
  }

  const shownError = status === "error" ? message : externalError;
  const inputClass = "sr-only";
  const buttonClass = cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors hover:bg-accent focus-within:ring-3 focus-within:ring-ring/40",
    busy && "pointer-events-none opacity-50",
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative">
        <Avatar src={url} name={name || "Karyawan"} className="size-24 text-2xl" />
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
          </span>
        ) : null}
      </div>
      <div className="grid gap-2 text-center sm:text-left">
        <p className="text-sm font-semibold">Foto profil (wajib)</p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <label htmlFor={`${id}-kamera`} className={buttonClass}>
            <Camera aria-hidden="true" className="size-4" />
            Ambil foto
            <input
              id={`${id}-kamera`}
              type="file"
              accept="image/*"
              capture="user"
              disabled={busy}
              className={inputClass}
              onChange={(event) => {
                void handle(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <label htmlFor={`${id}-galeri`} className={buttonClass}>
            <ImagePlus aria-hidden="true" className="size-4" />
            Pilih dari galeri
            <input
              id={`${id}-galeri`}
              type="file"
              accept="image/*"
              disabled={busy}
              className={inputClass}
              onChange={(event) => {
                void handle(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {status === "processing"
            ? "Memperkecil foto"
            : status === "uploading"
              ? "Mengunggah foto"
              : status === "done"
                ? message
                : "Wajah terlihat jelas, tanpa kacamata hitam."}
        </p>
        {shownError ? <p className="text-sm text-destructive">{shownError}</p> : null}
      </div>
    </div>
  );
}
