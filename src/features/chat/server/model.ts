import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { simulateReadableStream, type LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { env } from "@/env";

/** Kata kunci di pesan uji yang membuat model tiruan gagal, untuk menguji jawaban cadangan. */
export const MOCK_FAILURE_TRIGGER = "uji gangguan";

function lastUserText(prompt: unknown): string {
  if (!Array.isArray(prompt)) return "";
  for (let index = prompt.length - 1; index >= 0; index -= 1) {
    const message = prompt[index] as { role?: string; content?: unknown };
    if (message.role !== "user" || !Array.isArray(message.content)) continue;
    return (message.content as { type?: string; text?: string }[])
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join(" ");
  }
  return "";
}

/**
 * Model tiruan untuk E2E di CI (CLAUDE.md bagian 12): jawaban tetap dan tanpa memanggil Gemini.
 * Pesan yang memuat MOCK_FAILURE_TRIGGER membuat model gagal.
 */
function mockModel(): LanguageModel {
  return new MockLanguageModelV4({
    doStream: ({ prompt }) => {
      const question = lastUserText(prompt);
      if (question.toLowerCase().includes(MOCK_FAILURE_TRIGGER)) {
        return Promise.reject(new Error("Model tiruan sengaja gagal."));
      }
      const words =
        `Halo, saya Jaka dari KIS Group. Pertanyaan Anda: ${question}. Ada yang bisa saya bantu lagi?`
          .split(" ")
          .map((word, index, all) => (index < all.length - 1 ? `${word} ` : word));
      return Promise.resolve({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start" as const, id: "t1" },
            ...words.map((delta) => ({ type: "text-delta" as const, id: "t1", delta })),
            { type: "text-end" as const, id: "t1" },
            {
              type: "finish" as const,
              finishReason: { unified: "stop" as const, raw: undefined },
              logprobs: undefined,
              usage: {
                inputTokens: {
                  total: 40,
                  noCache: 40,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: { total: words.length, text: words.length, reasoning: undefined },
              },
            },
          ],
          chunkDelayInMs: 5,
        }),
      });
    },
  });
}

/** Model chat: tiruan di E2E, Gemini kalau kunci tersedia, null kalau belum dikonfigurasi. */
export function chatModel(): LanguageModel | null {
  if (env.CHAT_MOCK === "1") return mockModel();
  if (!env.GEMINI_API_KEY) return null;
  return createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })(env.GEMINI_MODEL);
}
