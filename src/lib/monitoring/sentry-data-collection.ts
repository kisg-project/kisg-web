import type { init } from "@sentry/nextjs";

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>["dataCollection"]>;

// Pengumpulan data Sentry dibuat minimal supaya patuh UU PDP (CLAUDE.md bagian 8):
// tanpa data user, cookie, body request, query URL (bisa berisi fbclid atau nomor HP),
// dan tanpa isi percakapan AI (Fase 7).
export const sentryDataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ["user-agent", "content-type"] }, response: false },
  httpBodies: [],
  urlQueryParams: false,
  genAI: { inputs: false, outputs: false },
};
