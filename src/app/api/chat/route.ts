import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  type TextStreamPart,
  type ToolSet,
} from "ai";
import { CHAT_LIMIT_REACHED, CHAT_LIMITS, CHAT_UNAVAILABLE } from "@/config/chat";
import { env } from "@/env";
import { getFeaturedProject, lowestPrice } from "@/features/projects";
import { chatRequestSchema, userText } from "@/features/chat/schemas/chat";
import { buildKnowledge } from "@/features/chat/server/knowledge";
import { chatModel } from "@/features/chat/server/model";
import { buildSystemPrompt } from "@/features/chat/server/prompt";
import { chatTools } from "@/features/chat/server/tools";
import { cleanChunk, cleanReply } from "@/features/chat/utils/sanitize";
import { formatDateWIB } from "@/lib/format";
import { clientIp, hashKey, hitRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Jawaban Gemini biasanya selesai dalam beberapa detik. Batas ini mencegah fungsi menggantung.
export const maxDuration = 30;

/** Tanggal kerja WIB, sama dengan private.today_wib() di database. */
function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/**
 * Jawaban pengganti yang tetap berbentuk pesan Jaka biasa, dengan penanda fallback supaya widget
 * menampilkan tombol WhatsApp. Tidak pernah pesan error teknis (keputusan owner).
 */
function fallback(text: string): Response {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "start", messageMetadata: { fallback: true } });
        writer.write({ type: "text-start", id: "fallback" });
        writer.write({ type: "text-delta", id: "fallback", delta: text });
        writer.write({ type: "text-end", id: "fallback" });
        writer.write({ type: "finish" });
      },
    }),
  });
}

/** Penyaring potongan teks yang di-stream: tanpa tanda pisah panjang, emoji, dan tanda tebal. */
function sanitizeTransform<TOOLS extends ToolSet>() {
  return () =>
    new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        controller.enqueue(
          chunk.type === "text-delta" ? { ...chunk, text: cleanChunk(chunk.text) } : chunk,
        );
      },
    });
}

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fallback(CHAT_UNAVAILABLE);
  const text = userText(parsed.data);
  if (!text) {
    return fallback(
      `Pesannya terlalu panjang. Coba ringkas, maksimal ${String(CHAT_LIMITS.maxMessageChars)} karakter.`,
    );
  }
  // Preview Vercel memakai database production: chat tidak menulis apa pun di sana.
  if (process.env.VERCEL_ENV === "preview") return fallback(CHAT_UNAVAILABLE);
  const model = chatModel();
  if (!model) return fallback(CHAT_UNAVAILABLE);

  const ip = await clientIp();
  if (!(await hitRateLimit("chat-ip", ip, 60 * 60, CHAT_LIMITS.messagesPerIpPerHour))) {
    return fallback(CHAT_LIMIT_REACHED);
  }

  const admin = createSupabaseAdminClient();
  const sessionId = parsed.data.id;
  const { data: session } = await admin
    .from("chat_sessions")
    .select("id, message_count")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    // Turnstile hanya di pesan pertama, supaya percakapan tetap lancar.
    if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
      return fallback(
        "Maaf, verifikasi keamanan belum berhasil. Muat ulang halaman, atau lanjut lewat WhatsApp.",
      );
    }
    const { error } = await admin.from("chat_sessions").insert({
      id: sessionId,
      ip_hash: hashKey(ip),
      page_path: parsed.data.pagePath?.slice(0, 300) ?? null,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    if (error) return fallback(CHAT_UNAVAILABLE);
  } else if (session.message_count >= CHAT_LIMITS.maxMessagesPerSession) {
    return fallback(CHAT_LIMIT_REACHED);
  }

  const { data: usage } = await admin
    .from("chat_usage_daily")
    .select("input_tokens, output_tokens")
    .eq("usage_date", todayWib())
    .maybeSingle();
  if (usage && usage.input_tokens + usage.output_tokens >= env.CHAT_DAILY_TOKEN_LIMIT) {
    return fallback(CHAT_UNAVAILABLE);
  }

  // Riwayat dari database (bukan dari browser), lalu pesan baru disimpan.
  const { data: rows } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(CHAT_LIMITS.historyMessages);
  const history = (rows ?? []).reverse();
  await admin.from("chat_messages").insert({ session_id: sessionId, role: "user", content: text });
  await admin
    .from("chat_sessions")
    .update({
      message_count: (session?.message_count ?? 0) + 1,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  const [knowledge, featured] = await Promise.all([buildKnowledge(), getFeaturedProject()]);
  const result = streamText({
    model,
    instructions: buildSystemPrompt(knowledge, formatDateWIB(new Date())),
    messages: [
      ...history.map((row) => ({
        role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: row.content,
      })),
      { role: "user" as const, content: text },
    ],
    tools: chatTools({
      sessionId,
      defaultPrice: featured ? lowestPrice(featured.unitTypes) : null,
      projectId: featured?.id ?? null,
    }),
    stopWhen: stepCountIs(4),
    maxOutputTokens: CHAT_LIMITS.maxOutputTokens,
    providerOptions: { google: { thinkingConfig: { thinkingLevel: env.CHAT_THINKING } } },
    experimental_transform: sanitizeTransform(),
    onEnd: async ({ text: reply, usage: totalUsage }) => {
      const content = cleanReply(reply).slice(0, 4000);
      if (content) {
        await admin.from("chat_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content,
          input_tokens: totalUsage.inputTokens ?? null,
          output_tokens: totalUsage.outputTokens ?? null,
        });
      }
      await admin.rpc("chat_record_usage", {
        p_input_tokens: totalUsage.inputTokens ?? 0,
        p_output_tokens: totalUsage.outputTokens ?? 0,
      });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // Pesan error teknis tidak pernah dikirim ke pengunjung. Widget menampilkan tawaran WhatsApp.
      onError: () => CHAT_UNAVAILABLE,
    }),
  });
}
