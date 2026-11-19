import type { Page, Request } from "@playwright/test";

// Layanan eksternal di-mock di level jaringan (CLAUDE.md bagian 5). Payload tetap dicatat supaya bisa di-assert.

export interface CapturedCall {
  url: string;
  method: string;
  body: string | null;
}

export interface ExternalCalls {
  meta: CapturedCall[];
  resend: CapturedCall[];
  turnstile: CapturedCall[];
}

function capture(request: Request): CapturedCall {
  return { url: request.url(), method: request.method(), body: request.postData() };
}

export async function mockExternalServices(page: Page): Promise<ExternalCalls> {
  const calls: ExternalCalls = { meta: [], resend: [], turnstile: [] };

  // Skrip Vercel Analytics dan Speed Insights hanya ada saat di-deploy ke Vercel.
  // Di production build lokal CI, path ini 404, jadi dijawab kosong.
  await page.route("**/_vercel/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );

  await page.route(
    /https:\/\/(graph\.facebook\.com|connect\.facebook\.net|www\.facebook\.com\/tr)/,
    (route) => {
      calls.meta.push(capture(route.request()));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"events_received":1}',
      });
    },
  );

  await page.route("https://api.resend.com/**", (route) => {
    calls.resend.push(capture(route.request()));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"id":"mock-email"}',
    });
  });

  await page.route("https://challenges.cloudflare.com/**", (route) => {
    calls.turnstile.push(capture(route.request()));
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });

  return calls;
}
