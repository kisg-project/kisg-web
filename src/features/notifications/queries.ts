import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationKind } from "./server/notify";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export async function unreadCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function listNotifications(userId: string, limit = 50): Promise<NotificationItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Notifikasi gagal dimuat: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}
