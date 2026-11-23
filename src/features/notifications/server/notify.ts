import "server-only";
import { createElement } from "react";
import { headers } from "next/headers";
import { after } from "next/server";
import { sendNotification, WebPushError } from "web-push";
import { formatOfficeAddress, siteConfig } from "@/config/site";
import { env } from "@/env";
import { sendEmail } from "@/lib/email/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { portalBase } from "@/features/pwa";
import { NotificationEmail } from "../emails/notification-email";
import { renderEmail } from "../emails/render";
import { publicPortalPath, pushPayload, safePortalHref } from "../utils";

export type NotificationKind = Database["public"]["Enums"]["notification_kind"];

export interface NotificationInput {
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  dedupeKey: string;
  email?: boolean;
}

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

async function settle(label: string, tasks: Promise<unknown>[]): Promise<void> {
  for (const result of await Promise.allSettled(tasks)) {
    if (result.status === "rejected") console.error(label, result.reason);
  }
}

export function pushConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

async function portalOrigin(): Promise<{ origin: string; base: string }> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "";
  const local = host.startsWith("127.0.0.1") || host.startsWith("localhost");
  const protocol = store.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return {
    origin: host ? `${protocol}://${host}` : env.NEXT_PUBLIC_SITE_URL,
    base: portalBase(host, process.env.PORTAL_HOST),
  };
}

async function pushTo(admin: AdminClient, userIds: string[], input: NotificationInput) {
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey || userIds.length === 0) return;
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  const payload = JSON.stringify(pushPayload(input));
  await settle(
    "Push gagal dikirim",
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          {
            vapidDetails: { subject: env.VAPID_SUBJECT, publicKey, privateKey },
            TTL: 86_400,
            urgency: "high",
            timeout: 10_000,
          },
        );
        await admin
          .from("push_subscriptions")
          .update({ last_success_at: new Date().toISOString() })
          .eq("id", subscription.id);
      } catch (error) {
        if (error instanceof WebPushError && [404, 410].includes(error.statusCode)) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
          return;
        }
        throw error;
      }
    }),
  );
}

async function emailTo(
  admin: AdminClient,
  userIds: string[],
  input: NotificationInput,
  link: string,
) {
  if (userIds.length === 0) return;
  const { data: people } = await admin
    .from("profiles")
    .select("email, full_name")
    .in("id", userIds)
    .eq("is_active", true)
    .is("deleted_at", null);
  await settle(
    "Email notifikasi gagal dikirim",
    (people ?? [])
      .filter((person) => person.email)
      .map(async (person) => {
        const { html, text } = await renderEmail(
          createElement(NotificationEmail, {
            name: person.full_name.split(" ")[0] || "rekan KIS",
            title: input.title,
            body: input.body,
            link,
            siteUrl: env.NEXT_PUBLIC_SITE_URL,
            legalName: siteConfig.legalName,
            address: formatOfficeAddress(),
          }),
        );
        await sendEmail({
          to: { email: person.email, name: person.full_name },
          subject: input.title,
          html,
          text,
        });
      }),
  );
}

export async function deliverNotification(
  userIds: readonly string[],
  input: NotificationInput,
  origin: { origin: string; base: string },
): Promise<string[]> {
  const recipients = [...new Set(userIds)];
  if (recipients.length === 0) return [];
  const admin = createSupabaseAdminClient();
  const href = safePortalHref(input.href);
  const { data, error } = await admin
    .from("notifications")
    .upsert(
      recipients.map((userId) => ({
        user_id: userId,
        kind: input.kind,
        title: input.title.slice(0, 120),
        body: input.body.slice(0, 400),
        href,
        dedupe_key: input.dedupeKey,
      })),
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
    )
    .select("user_id");
  if (error) throw new Error(`Notifikasi gagal disimpan: ${error.message}`);
  const fresh = data.map((row) => row.user_id);
  const link = `${origin.origin}${publicPortalPath(href, origin.base)}`;
  await settle("Notifikasi gagal dikirim", [
    pushTo(admin, fresh, { ...input, href }),
    input.email ? emailTo(admin, fresh, input, link) : Promise.resolve(),
  ]);
  return fresh;
}

export async function notify(userIds: readonly string[], input: NotificationInput): Promise<void> {
  const origin = await portalOrigin();
  after(async () => {
    try {
      await deliverNotification(userIds, input, origin);
    } catch (error) {
      console.error("Notifikasi gagal dikirim", error);
    }
  });
}

export async function approversOf(
  userId: string,
  roles: readonly Database["public"]["Enums"]["app_role"][],
): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("notification_approvers", { p_user: userId });
  if (error) throw new Error(`Penyetuju gagal dibaca: ${error.message}`);
  if (data.length === 0) return [];
  const { data: rows } = await admin
    .from("user_roles")
    .select("user_id")
    .in("user_id", data)
    .in("role", [...roles]);
  return [...new Set((rows ?? []).map((row) => row.user_id))];
}
