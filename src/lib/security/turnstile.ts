import "server-only";
import { env } from "@/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifikasi token Cloudflare Turnstile di server. Kalau TURNSTILE_SECRET_KEY belum diisi (akun
 * Cloudflare belum siap, CI), verifikasi dilewati dan form tetap dijaga honeypot dan rate limit.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
  secret = env.TURNSTILE_SECRET_KEY,
): Promise<boolean> {
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
