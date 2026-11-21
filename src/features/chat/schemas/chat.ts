import { z } from "zod";
import { CHAT_LIMITS } from "@/config/chat";

/**
 * Permintaan dari widget: hanya pesan terakhir pengunjung dan id percakapan. Riwayat dimuat server dari
 * database, jadi pengunjung tidak bisa menyisipkan jawaban palsu atas nama Jaka.
 */
export const chatRequestSchema = z.object({
  id: z.uuid(),
  message: z.object({
    id: z.string().min(1).max(100),
    role: z.literal("user"),
    parts: z
      .array(z.object({ type: z.literal("text"), text: z.string() }))
      .min(1)
      .max(4),
  }),
  pagePath: z.string().max(300).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Teks pesan pengunjung yang sudah dirapikan, atau null kalau kosong atau terlalu panjang. */
export function userText(request: ChatRequest): string | null {
  const text = request.message.parts
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text.length > CHAT_LIMITS.maxMessageChars) return null;
  return text;
}

/** Data kontak dari percakapan untuk lead (tool create_lead). */
export const chatLeadSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  consent: z.literal(true),
  note: z.string().trim().max(500).optional(),
});
