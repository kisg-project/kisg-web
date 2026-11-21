"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { FileText, ImagePlus, LoaderCircle, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WORK_REPORT, WORK_REPORT_LABEL, type WorkReportKind } from "@/config/attendance";
import { compressImage, ImageCompressionError } from "@/lib/image";
import { cn } from "@/lib/utils";
import { submitWorkReportAction } from "../actions/attendance";
import { workReportSchema, type WorkAttachment, type WorkReportInput } from "../schemas/attendance";

interface Item {
  key: string;
  name: string;
  status: "uploading" | "ready" | "error";
  message?: string;
  attachment?: WorkAttachment;
}

/** Path unggah mengikuti host: /portal/absensi/lampiran di domain utama, /absensi/lampiran di portal. */
function uploadUrl(): string {
  return window.location.pathname.startsWith("/portal")
    ? "/portal/absensi/lampiran"
    : "/absensi/lampiran";
}

function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
    : `${String(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

async function prepare(file: File): Promise<File> {
  if (file.type.startsWith("image/")) return (await compressImage(file, "siteReport")).file;
  if (!(file.type in WORK_REPORT.documentTypes)) {
    throw new Error("Format file tidak didukung. Pakai foto, PDF, Word, atau Excel.");
  }
  if (file.size > WORK_REPORT.maxFileBytes)
    throw new Error("Ukuran file terlalu besar. Maksimal 2 MB.");
  return file;
}

async function upload(file: File): Promise<WorkAttachment> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(uploadUrl(), { method: "POST", body });
  const result = (await response.json().catch(() => null)) as
    ({ ok: true } & WorkAttachment) | { ok: false; message: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? "Lampiran gagal diunggah. Coba lagi.");
  return { path: result.path, name: result.name, type: result.type, size: result.size };
}

/**
 * Formulir rencana kegiatan atau hasil kerja hari ini. Foto dikompres di HP (profil siteReport),
 * dokumen dibatasi jenis dan ukurannya, dan setiap lampiran langsung diunggah saat dipilih.
 */
export function WorkReportForm({
  kind,
  initial,
}: {
  kind: WorkReportKind;
  initial: { content: string; attachments: WorkAttachment[] } | null;
}) {
  const id = useId();
  const label = WORK_REPORT_LABEL[kind];
  const [items, setItems] = useState<Item[]>(() =>
    (initial?.attachments ?? []).map((attachment) => ({
      key: attachment.path,
      name: attachment.name,
      status: "ready" as const,
      attachment,
    })),
  );
  const form = useForm<WorkReportInput>({
    resolver: zodResolver(workReportSchema),
    defaultValues: { kind, content: initial?.content ?? "", attachments: [] },
  });
  const { execute, result, isPending, hasNavigated } = useAction(submitWorkReportAction);
  const uploading = items.some((item) => item.status === "uploading");
  const busy = isPending || hasNavigated;
  const full = items.filter((item) => item.status !== "error").length >= WORK_REPORT.maxFiles;

  function update(key: string, patch: Partial<Item>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addFiles(list: FileList | null) {
    const room = WORK_REPORT.maxFiles - items.filter((item) => item.status !== "error").length;
    const files = Array.from(list ?? []).slice(0, Math.max(0, room));
    for (const file of files) {
      const key = crypto.randomUUID();
      setItems((current) => [...current, { key, name: file.name, status: "uploading" }]);
      void prepare(file)
        .then(upload)
        .then((attachment) => {
          update(key, { status: "ready", name: attachment.name, attachment });
        })
        .catch((caught: unknown) => {
          update(key, {
            status: "error",
            message:
              caught instanceof ImageCompressionError || caught instanceof Error
                ? caught.message
                : "Lampiran gagal diunggah. Coba lagi.",
          });
        });
    }
  }

  const contentError = form.formState.errors.content?.message;
  const pickerClass = cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent focus-within:ring-3 focus-within:ring-ring/40",
    (full || busy) && "pointer-events-none opacity-50",
  );

  return (
    <form
      noValidate
      aria-label={label.title}
      className="grid gap-5"
      onSubmit={(event) => {
        form.setValue(
          "attachments",
          items.flatMap((item) => (item.attachment ? [item.attachment] : [])),
        );
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-isi`}>{label.field}</Label>
        <p id={`${id}-petunjuk`} className="text-sm text-subtle-foreground">
          {label.hint}
        </p>
        <Textarea
          id={`${id}-isi`}
          rows={6}
          maxLength={WORK_REPORT.maxChars}
          className="min-h-36 rounded-2xl text-base"
          aria-invalid={contentError ? true : undefined}
          aria-describedby={`${id}-petunjuk${contentError ? ` ${id}-error` : ""}`}
          {...form.register("content")}
        />
        {contentError ? (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {contentError}
          </p>
        ) : null}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Paperclip aria-hidden="true" className="size-4" />
          Lampiran (opsional, maksimal {WORK_REPORT.maxFiles} file)
        </legend>
        <div className="flex flex-wrap gap-2">
          <label className={pickerClass}>
            <ImagePlus aria-hidden="true" className="size-4" />
            Tambah foto
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={full || busy}
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <label className={pickerClass}>
            <FileText aria-hidden="true" className="size-4" />
            Tambah file
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,application/pdf"
              multiple
              className="sr-only"
              disabled={full || busy}
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-xs text-subtle-foreground">
          Foto diperkecil otomatis. PDF, Word, atau Excel maksimal 2 MB.
        </p>
        {items.length > 0 ? (
          <ul aria-label="Lampiran" className="grid gap-2">
            {items.map((item) => (
              <li
                key={item.key}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-2",
                  item.status === "error" && "border-destructive/40 bg-destructive/5",
                )}
              >
                {item.status === "uploading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-5 shrink-0 animate-spin text-primary"
                  />
                ) : (
                  <FileText aria-hidden="true" className="size-5 shrink-0 text-subtle-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.name}</span>
                  <span
                    className={cn(
                      "block text-xs",
                      item.status === "error" ? "text-destructive" : "text-subtle-foreground",
                    )}
                  >
                    {item.status === "uploading"
                      ? "Mengunggah"
                      : item.status === "error"
                        ? item.message
                        : sizeLabel(item.attachment?.size ?? 0)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Hapus lampiran ${item.name}`}
                  disabled={item.status === "uploading" || busy}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                  onClick={() => {
                    setItems((current) => current.filter((entry) => entry.key !== item.key));
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </fieldset>

      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={busy || uploading}
        aria-busy={busy}
        className="h-14 w-full rounded-2xl text-base aria-busy:opacity-100"
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Send aria-hidden="true" />
        )}
        {busy ? "Menyimpan" : uploading ? "Menunggu lampiran" : label.submit}
      </Button>
    </form>
  );
}
