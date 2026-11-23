"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authActionClient } from "@/lib/safe-action";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  openNotificationSchema,
  pushSubscriptionSchema,
  removePushSubscriptionSchema,
} from "./schemas";
import { safePortalHref } from "./utils";

export const openNotificationAction = authActionClient
  .inputSchema(openNotificationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data } = await ctx.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", parsedInput.id)
      .eq("user_id", ctx.userId)
      .select("href")
      .maybeSingle();
    redirect(safePortalHref(data?.href));
  });

export const markAllReadAction = authActionClient.action(async ({ ctx }) => {
  const { error } = await ctx.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", ctx.userId)
    .is("read_at", null);
  if (error) throw new Error(`Notifikasi gagal ditandai: ${error.message}`);
  return { ok: true as const };
});

export const savePushSubscriptionAction = authActionClient
  .inputSchema(pushSubscriptionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
    const { error } = await createSupabaseAdminClient().from("push_subscriptions").upsert(
      {
        user_id: ctx.userId,
        endpoint: parsedInput.endpoint,
        p256dh: parsedInput.p256dh,
        auth: parsedInput.auth,
        user_agent: userAgent,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(`Langganan push gagal disimpan: ${error.message}`);
    return { ok: true as const };
  });

export const removePushSubscriptionAction = authActionClient
  .inputSchema(removePushSubscriptionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", parsedInput.endpoint)
      .eq("user_id", ctx.userId);
    if (error) throw new Error(`Langganan push gagal dihapus: ${error.message}`);
    return { ok: true as const };
  });
