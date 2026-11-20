import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Kunci rate limit di-hash supaya IP dan email tidak tersimpan mentah (UU PDP). */
export function hashKey(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/** IP pengunjung dari header proxy Vercel. */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || store.get("x-real-ip") || "tidak-diketahui";
}

/**
 * Mencatat satu percobaan dan mengembalikan true kalau masih di bawah batas.
 * Gagal tertutup: kalau database tidak bisa dihubungi, percobaan dianggap melewati batas.
 */
export async function hitRateLimit(
  scope: string,
  identity: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  const { data, error } = await createSupabaseAdminClient().rpc("rate_limit_hit", {
    p_key: `${scope}:${hashKey(identity)}`,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) return false;
  return data;
}
