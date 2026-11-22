import type { Metadata } from "next";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { requirePortalUser } from "@/features/auth";
import { MarkAllReadButton, NotificationList } from "@/features/notifications";
import { listNotifications } from "@/features/notifications/server";

export const metadata: Metadata = { title: "Notifikasi" };

export default async function NotificationsPage() {
  const user = await requirePortalUser(undefined, { skipWorkReport: true });
  const items = await listNotifications(user.id);
  const unread = items.filter((item) => !item.readAt).length;
  return (
    <div className="tone-blue grid grid-cols-[minmax(0,1fr)] gap-4">
      <PageHeader
        title="Notifikasi"
        description={unread > 0 ? `${String(unread)} belum dibaca` : "Semua sudah dibaca"}
        actions={<MarkAllReadButton disabled={unread === 0} />}
      />
      <div className="max-w-3xl min-w-0">
        {items.length > 0 ? (
          <NotificationList items={items} />
        ) : (
          <EmptyState
            icon={Notification03Icon}
            title="Belum ada notifikasi"
            description="Pengajuan dan keputusan yang perlu Anda ketahui muncul di sini."
          />
        )}
      </div>
    </div>
  );
}
