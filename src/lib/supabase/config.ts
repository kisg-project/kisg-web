import "server-only";
import { env } from "@/env";

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

/** Konfigurasi Supabase untuk portal. Error jelas kalau env belum diisi di lingkungan itu. */
export function getSupabaseConfig(): SupabaseConfig {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY belum diisi untuk lingkungan ini.");
  }
  return { url: env.SUPABASE_URL, publishableKey: env.SUPABASE_PUBLISHABLE_KEY };
}
