// Membaca email yang ditangkap Mailpit milik Supabase lokal (port 54324, supabase/config.toml).
import { expect } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitSummary {
  ID: string;
  Subject: string;
}

export interface Email {
  subject: string;
  html: string;
  text: string;
}

async function search(to: string): Promise<MailpitSummary[]> {
  const url = new URL("/api/v1/search", MAILPIT_URL);
  url.searchParams.set("query", `to:"${to}"`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Mailpit tidak bisa dihubungi (${String(response.status)}).`);
  const body = (await response.json()) as { messages: MailpitSummary[] | null };
  return body.messages ?? [];
}

/** Menunggu email terbaru ke alamat itu (dengan subjek tertentu) sampai 20 detik. */
export async function waitForEmail(to: string, subject: string): Promise<Email> {
  let found: MailpitSummary | undefined;
  await expect
    .poll(
      async () => {
        found = (await search(to)).find((message) => message.Subject === subject);
        return found !== undefined;
      },
      { timeout: 20_000, message: `Email "${subject}" ke ${to} tidak datang.` },
    )
    .toBe(true);
  if (!found) throw new Error("Email tidak ditemukan.");
  const response = await fetch(new URL(`/api/v1/message/${found.ID}`, MAILPIT_URL));
  const message = (await response.json()) as { Subject: string; HTML: string; Text: string };
  return { subject: message.Subject, html: message.HTML, text: message.Text };
}

/** Tautan pertama di email yang menuju path tertentu. Entitas &amp; dikembalikan ke &. */
export function linkFrom(email: Email, pathname: string): string {
  const links = [...email.html.matchAll(/href="([^"]+)"/g)].map((match) =>
    (match[1] ?? "").replaceAll("&amp;", "&"),
  );
  const link = links.find((href) => href.includes(pathname));
  if (!link) throw new Error(`Email tidak berisi tautan ke ${pathname}.`);
  return link;
}

/** Jumlah email ke alamat itu, untuk memastikan email tidak dikirim. */
export async function countEmails(to: string): Promise<number> {
  return (await search(to)).length;
}

/** Kode 6 digit (OTP Supabase Auth) di email lupa password atau ganti password. */
export function codeFrom(email: Email): string {
  const code =
    /letter-spacing:10px[^>]*>(\d{6})</.exec(email.html)?.[1] ??
    /\b(\d{6})\b/.exec(email.text)?.[1];
  if (!code) throw new Error("Email tidak berisi kode 6 digit.");
  return code;
}
