import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/env", () => ({ env: {} }));

const { verifyTurnstile } = await import("./turnstile");

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(response: Partial<Response> | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response as Response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("verifyTurnstile", () => {
  it("dilewati kalau secret belum diisi", async () => {
    const fetchMock = mockFetch({ ok: true });
    await expect(verifyTurnstile(undefined, "1.1.1.1", "")).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("menolak tanpa token kalau secret ada", async () => {
    await expect(verifyTurnstile(undefined, "1.1.1.1", "rahasia")).resolves.toBe(false);
  });

  it("menerima token yang lolos verifikasi Cloudflare", async () => {
    const fetchMock = mockFetch({ ok: true, json: () => Promise.resolve({ success: true }) });
    await expect(verifyTurnstile("token", "1.1.1.1", "rahasia")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("menolak token gagal, respons error, atau jaringan putus", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ success: false }) });
    await expect(verifyTurnstile("token", "1.1.1.1", "rahasia")).resolves.toBe(false);
    mockFetch({ ok: false });
    await expect(verifyTurnstile("token", "1.1.1.1", "rahasia")).resolves.toBe(false);
    mockFetch(new Error("putus"));
    await expect(verifyTurnstile("token", "1.1.1.1", "rahasia")).resolves.toBe(false);
  });
});
