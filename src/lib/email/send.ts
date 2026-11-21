import "server-only";
import { env } from "@/env";

export interface EmailAttachment {
  filename: string;
  /** Isi file dalam base64. */
  content: string;
}

export interface EmailMessage {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export type EmailResult =
  { sent: true; provider: "brevo" | "mailpit" } | { sent: false; provider: "none" };

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 15_000;

/**
 * Mengirim email aplikasi. Production: API HTTP Brevo dari notifikasi@kisgroup.co.id (CLAUDE.md
 * bagian 3 dan 8). Lokal dan CI: Mailpit Supabase lokal. Tanpa keduanya: tidak mengirim apa pun,
 * pemanggil menampilkan cara lain (misal tautan undangan untuk disalin).
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (env.BREVO_API_KEY) {
    await post(
      BREVO_ENDPOINT,
      { "api-key": env.BREVO_API_KEY },
      {
        sender: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
        replyTo: { email: env.EMAIL_REPLY_TO },
        to: [{ email: message.to.email, name: message.to.name }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
        attachment: message.attachments?.map((file) => ({
          name: file.filename,
          content: file.content,
        })),
      },
    );
    return { sent: true, provider: "brevo" };
  }
  if (env.MAILPIT_URL) {
    await post(
      new URL("/api/v1/send", env.MAILPIT_URL).toString(),
      {},
      {
        From: { Email: env.EMAIL_FROM, Name: env.EMAIL_FROM_NAME },
        ReplyTo: [{ Email: env.EMAIL_REPLY_TO }],
        To: [{ Email: message.to.email, Name: message.to.name ?? "" }],
        Subject: message.subject,
        HTML: message.html,
        Text: message.text,
        Attachments: message.attachments?.map((file) => ({
          Filename: file.filename,
          Content: file.content,
        })),
      },
    );
    return { sent: true, provider: "mailpit" };
  }
  return { sent: false, provider: "none" };
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    // Isi respons tidak dicatat utuh karena bisa memuat alamat penerima.
    throw new Error(`Pengiriman email gagal (${String(response.status)}).`);
  }
}
