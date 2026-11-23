import { z } from "zod";

export const openNotificationSchema = z.object({ id: z.uuid() });

export const pushSubscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(100),
});

export const removePushSubscriptionSchema = pushSubscriptionSchema.pick({ endpoint: true });
