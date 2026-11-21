import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env: Record<string, string | undefined> = {};
vi.mock("@/env", () => ({ env }));

const { sendEmail } = await import("./send");

const message = {
  to: { email: "budi@kis.test", name: "Budi" },
  subject: "Undangan",
  html: "<p>Halo</p>",
  text: "Halo",
  attachments: [{ filename: "slip.pdf", content: "UERG" }],
};

const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();

beforeEach(() => {
  for (const key of Object.keys(env)) env[key] = undefined;
  Object.assign(env, {
    EMAIL_FROM: "notifikasi@kisgroup.co.id",
    EMAIL_FROM_NAME: "KIS Group",
    EMAIL_REPLY_TO: "corporate@kisgroup.co.id",
  });
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function sentBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls[0]?.[1];
  const body = init?.body;
  return JSON.parse(typeof body === "string" ? body : "{}") as Record<string, unknown>;
}

describe("sendEmail", () => {
  it("tanpa Brevo dan Mailpit: tidak mengirim apa pun", async () => {
    expect(await sendEmail(message)).toEqual({ sent: false, provider: "none" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Brevo: pengirim notifikasi, balasan ke corporate, lampiran, dan API key di header", async () => {
    env.BREVO_API_KEY = "kunci-uji";
    expect(await sendEmail(message)).toEqual({ sent: true, provider: "brevo" });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(new Headers(init?.headers).get("api-key")).toBe("kunci-uji");
    expect(sentBody()).toMatchObject({
      sender: { email: "notifikasi@kisgroup.co.id", name: "KIS Group" },
      replyTo: { email: "corporate@kisgroup.co.id" },
      to: [{ email: "budi@kis.test", name: "Budi" }],
      subject: "Undangan",
      htmlContent: "<p>Halo</p>",
      textContent: "Halo",
      attachment: [{ name: "slip.pdf", content: "UERG" }],
    });
  });

  it("Mailpit (lokal dan CI): format API Mailpit", async () => {
    env.MAILPIT_URL = "http://127.0.0.1:54324";
    expect(await sendEmail(message)).toEqual({ sent: true, provider: "mailpit" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:54324/api/v1/send");
    expect(sentBody()).toMatchObject({
      From: { Email: "notifikasi@kisgroup.co.id" },
      To: [{ Email: "budi@kis.test", Name: "Budi" }],
      Attachments: [{ Filename: "slip.pdf", Content: "UERG" }],
    });
  });

  it("gagal kirim: error tanpa membocorkan isi respons", async () => {
    env.BREVO_API_KEY = "kunci-uji";
    fetchMock.mockResolvedValue(new Response("alamat budi@kis.test ditolak", { status: 400 }));
    await expect(sendEmail(message)).rejects.toThrow("Pengiriman email gagal (400).");
  });
});
