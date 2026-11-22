"use client";

import { useAction } from "next-safe-action/hooks";
import {
  ArrowRight01Icon,
  Location01Icon,
  FingerPrintIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { formatDateTimeWIB } from "@/lib/format";
import { cn } from "@/lib/utils";
import { markAllReadAction, openNotificationAction } from "../actions";
import type { NotificationItem } from "../queries";

const KIND_ICON: Record<NotificationItem["kind"], { icon: AppIcon; tone: string }> = {
  absen_luar_lokasi_diajukan: { icon: Location01Icon, tone: "bg-orange-100 text-orange-700" },
  absen_luar_lokasi_diputuskan: {
    icon: CheckmarkCircle02Icon,
    tone: "bg-primary-100 text-primary-700",
  },
  sidik_jari_direset: { icon: FingerPrintIcon, tone: "bg-violet-100 text-violet-700" },
};

function NotificationRow({ item }: { item: NotificationItem }) {
  const open = useAction(openNotificationAction, {
    onError: () => toast.error("Notifikasi gagal dibuka. Coba lagi."),
  });
  const look = KIND_ICON[item.kind];
  const unread = !item.readAt;
  return (
    <li>
      <button
        type="button"
        disabled={open.isPending}
        onClick={() => {
          open.execute({ id: item.id });
        }}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-(--band-soft) disabled:opacity-60",
          unread && "bg-(--band-soft)/60",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(look.tone, "grid size-9 shrink-0 place-items-center rounded-lg")}
        >
          <Icon icon={look.icon} size={18} />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="flex items-center gap-2">
            <span
              className={cn("truncate text-[0.8125rem]", unread ? "font-semibold" : "font-medium")}
            >
              {item.title}
            </span>
            {unread ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-[0.6875rem] font-medium text-primary-700">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-600" />
                Baru
              </span>
            ) : null}
          </span>
          {item.body ? (
            <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
          ) : null}
          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
            {formatDateTimeWIB(item.createdAt)}
          </span>
        </span>
        <Icon
          icon={ArrowRight01Icon}
          size={16}
          className="arrow-nudge mt-2.5 text-muted-foreground"
        />
      </button>
    </li>
  );
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <ul
      aria-label="Daftar notifikasi"
      className="divide-y divide-(--line-strong) overflow-hidden rounded-xl border border-(--line-strong) bg-card"
    >
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const mark = useAction(markAllReadAction, {
    onSuccess: () => toast.success("Semua notifikasi sudah dibaca."),
    onError: () => toast.error("Notifikasi gagal ditandai. Coba lagi."),
  });
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled || mark.isPending}
      onClick={() => {
        mark.execute();
      }}
    >
      Tandai semua dibaca
    </Button>
  );
}
