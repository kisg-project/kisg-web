import Link from "next/link";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { unreadCount } from "../queries";
import { unreadBadge } from "../utils";

export async function NotificationBell({ userId }: { userId: string }) {
  const badge = unreadBadge(await unreadCount(userId));
  return (
    <Link
      href="/portal/notifikasi"
      className="hit-44 relative flex size-9 items-center justify-center rounded-lg border border-(--line-strong) bg-card transition-colors hover:bg-(--band-soft) motion-safe:active:scale-95"
    >
      <Icon icon={Notification03Icon} size={18} />
      <span className="sr-only">Notifikasi{badge ? `, ${badge} belum dibaca` : ""}</span>
      {badge ? (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-danger-600 px-1 text-[0.625rem] leading-none font-semibold text-white tabular-nums ring-2 ring-background"
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
