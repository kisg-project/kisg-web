"use client";

// eslint-disable-next-line no-restricted-imports -- satu-satunya pembungkus sonner yang diizinkan
import { toast as sonner } from "sonner";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { friendlyMessage } from "@/lib/utils/friendly-message";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info" | "warning";

const STYLE: Record<Kind, { icon: LucideIcon; chip: string; bar: string }> = {
  success: {
    icon: CircleCheck,
    chip: "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300",
    bar: "bg-success-600",
  },
  error: {
    icon: CircleAlert,
    chip: "bg-danger-100 text-danger-700 dark:bg-danger-950 dark:text-danger-300",
    bar: "bg-danger-600",
  },
  info: {
    icon: Info,
    chip: "bg-info-100 text-info-700 dark:bg-info-950 dark:text-info-300",
    bar: "bg-info-600",
  },
  warning: {
    icon: TriangleAlert,
    chip: "bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-300",
    bar: "bg-warning-500",
  },
};

function ToastCard({
  id,
  kind,
  message,
  description,
}: {
  id: string | number;
  kind: Kind;
  message: string;
  description?: string;
}) {
  const { icon: Icon, chip, bar } = STYLE[kind];
  return (
    <button
      type="button"
      onClick={() => sonner.dismiss(id)}
      className="app-feel relative flex w-[min(92vw,24rem)] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-popover py-3 pr-4 pl-3 text-left text-popover-foreground shadow-[0_18px_40px_-16px_rgb(1_41_34/0.45)] ring-1 ring-border"
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", bar)} />
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{message}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

function show(kind: Kind, message: string, options?: { description?: string }) {
  const text = friendlyMessage(message);
  const description = options?.description ? friendlyMessage(options.description, "") : "";
  return sonner.custom(
    (id) => <ToastCard id={id} kind={kind} message={text} description={description || undefined} />,
    { duration: kind === "error" ? 6000 : 3500, unstyled: true },
  );
}

/**
 * Toast custom KIS (keputusan owner, 22 November 2026): kartu membulat dengan ikon berwarna per jenis.
 * Semua pesan disaring friendlyMessage, jadi bahasa sistem atau kode tidak pernah tampil. Komponen
 * lain wajib memakai modul ini, bukan sonner langsung (aturan ESLint).
 */
export const toast = {
  success: (message: string, options?: { description?: string }) =>
    show("success", message, options),
  error: (message: string, options?: { description?: string }) => show("error", message, options),
  info: (message: string, options?: { description?: string }) => show("info", message, options),
  warning: (message: string, options?: { description?: string }) =>
    show("warning", message, options),
  dismiss: (id?: string | number) => sonner.dismiss(id),
};
