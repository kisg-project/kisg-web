"use client";

// eslint-disable-next-line no-restricted-imports -- satu-satunya pembungkus sonner yang diizinkan
import { toast as sonner } from "sonner";
import { friendlyMessage } from "@/lib/utils/friendly-message";
import { cn } from "@/lib/utils";
import {
  Alert02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";

type Kind = "success" | "error" | "info" | "warning";

const STYLE: Record<Kind, { icon: AppIcon; chip: string; bar: string }> = {
  success: {
    icon: CheckmarkCircle02Icon,
    chip: "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300",
    bar: "bg-success-600",
  },
  error: {
    icon: AlertCircleIcon,
    chip: "bg-danger-100 text-danger-700 dark:bg-danger-950 dark:text-danger-300",
    bar: "bg-danger-600",
  },
  info: {
    icon: InformationCircleIcon,
    chip: "bg-info-100 text-info-700 dark:bg-info-950 dark:text-info-300",
    bar: "bg-info-600",
  },
  warning: {
    icon: Alert02Icon,
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
  const { icon, chip, bar } = STYLE[kind];
  return (
    <button
      type="button"
      onClick={() => sonner.dismiss(id)}
      className="app-feel relative flex w-[min(92vw,24rem)] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-popover py-3 pr-4 pl-3 text-left text-popover-foreground shadow-[0_18px_40px_-16px_rgb(1_41_34/0.45)] ring-1 ring-border"
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", bar)} />
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon icon={icon} className="size-5" />
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

export const toast = {
  success: (message: string, options?: { description?: string }) =>
    show("success", message, options),
  error: (message: string, options?: { description?: string }) => show("error", message, options),
  info: (message: string, options?: { description?: string }) => show("info", message, options),
  warning: (message: string, options?: { description?: string }) =>
    show("warning", message, options),
  dismiss: (id?: string | number) => sonner.dismiss(id),
};
