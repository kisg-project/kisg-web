"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert02Icon, Loading03Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";

export type DialogTone = "primary" | "danger";
const TONE: Record<DialogTone, { band: string; chip: string; ring: string }> = {
  primary: {
    band: "bg-linear-to-b from-primary-100/80 via-primary-50/60 to-popover dark:from-primary-900/70 dark:via-primary-950/40",
    chip: "bg-primary-100 text-primary-800 ring-1 ring-primary-200 dark:bg-primary-900 dark:text-primary-100 dark:ring-primary-800",
    ring: "border-primary-200/70 dark:border-primary-800/50",
  },
  danger: {
    band: "bg-linear-to-b from-danger-100/80 via-danger-50/60 to-popover dark:from-danger-900/60 dark:via-danger-950/40",
    chip: "bg-danger-100 text-danger-700 ring-1 ring-danger-200 dark:bg-danger-900 dark:text-danger-100 dark:ring-danger-800",
    ring: "border-danger-200/70 dark:border-danger-800/50",
  },
};

const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.6;

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  busy = false,
  icon = PencilEdit01Icon,
  tone = "primary",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  busy?: boolean;
  icon?: AppIcon;
  tone?: DialogTone;
  children: ReactNode;
}) {
  const style = TONE[tone];
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number; offset: number } | null>(null);

  const setOffset = (offset: number, animate: boolean) => {
    const element = sheet.current;
    if (!element) return;
    element.style.transition = animate ? "transform 200ms cubic-bezier(0.32, 0.72, 0, 1)" : "none";
    element.style.transform = offset > 0 ? `translateY(${String(offset)}px)` : "";
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (busy || !window.matchMedia("(max-width: 639px)").matches) return;
    drag.current = { startY: event.clientY, startTime: performance.now(), offset: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current.offset = Math.max(0, event.clientY - drag.current.startY);
    setOffset(drag.current.offset, false);
  };
  const onPointerEnd = () => {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    const velocity = current.offset / Math.max(1, performance.now() - current.startTime);
    if (current.offset > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
      setOffset(window.innerHeight, true);
      window.setTimeout(() => {
        onOpenChange(false);
        setOffset(0, false);
      }, 180);
    } else {
      setOffset(0, true);
    }
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-neutral-950/45 supports-backdrop-filter:backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          ref={sheet}
          onPointerDownOutside={(event) => {
            event.preventDefault();
          }}
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          className={cn(
            "app-feel fixed z-50 flex flex-col overflow-hidden bg-popover text-popover-foreground shadow-2xl outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[1.75rem] pb-[env(safe-area-inset-bottom)] data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[85dvh] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:pb-0 sm:data-open:fade-in-0 sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95 sm:data-closed:fade-out-0 sm:data-closed:slide-out-to-bottom-0 sm:data-closed:zoom-out-95",
          )}
        >
          <div
            className={cn(
              "relative isolate shrink-0 touch-none overflow-hidden rounded-t-[1.75rem] px-5 pt-3 pb-5 sm:px-6 sm:pt-6",
              style.band,
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute -top-16 -right-12 -z-10 size-44 rounded-full border-[14px]",
                style.ring,
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "absolute -top-6 right-14 -z-10 size-16 rounded-full border-[6px]",
                style.ring,
              )}
            />
            <span
              aria-hidden="true"
              className="mx-auto mb-4 block h-1.5 w-11 rounded-full bg-neutral-400/60 sm:hidden"
            />
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                  style.chip,
                )}
              >
                <Icon icon={icon} className="size-6" />
              </span>
              <div className="min-w-0 pt-0.5">
                <DialogPrimitive.Title className="text-lg leading-snug font-bold">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                ) : (
                  <DialogPrimitive.Description className="sr-only">
                    {title}
                  </DialogPrimitive.Description>
                )}
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-1 sm:px-6">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function FormDialogFooter({
  onCancel,
  busy = false,
  saveLabel = "Simpan",
  busyLabel = "Menyimpan",
  saveVariant = "save",
  saveIcon,
  disabled = false,
}: {
  onCancel: () => void;
  busy?: boolean;
  saveLabel?: string;
  busyLabel?: string;
  saveVariant?: "save" | "cancel";
  saveIcon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-2 grid grid-cols-2 gap-3 border-t border-border bg-popover px-5 pt-4 pb-4 sm:-mx-6 sm:px-6 sm:pb-5">
      <Button type="button" variant="cancel" size="lg" disabled={busy} onClick={onCancel}>
        Batal
      </Button>
      <Button
        type="submit"
        variant={saveVariant}
        size="lg"
        disabled={busy || disabled}
        aria-busy={busy}
        className="aria-busy:opacity-100"
      >
        {busy ? (
          <Icon icon={Loading03Icon} aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          saveIcon
        )}
        {busy ? busyLabel : saveLabel}
      </Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busyLabel = "Memproses",
  busy = false,
  error,
  onConfirm,
  trigger,
  icon = Alert02Icon,
  tone = "danger",
}: {
  icon?: AppIcon;
  tone?: DialogTone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  trigger?: ReactNode;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      trigger={trigger}
      busy={busy}
      icon={icon}
      tone={tone}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) onConfirm();
        }}
      >
        {error ? (
          <p role="alert" className="pt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <FormDialogFooter
          busy={busy}
          saveLabel={confirmLabel}
          busyLabel={busyLabel}
          onCancel={() => {
            onOpenChange(false);
          }}
        />
      </form>
    </FormDialog>
  );
}
