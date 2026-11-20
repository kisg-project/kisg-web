import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";
import type { Database } from "./database.types";

/**
 * Client dengan secret key (melewati RLS). Hanya untuk server: rate limit, undangan, tugas admin.
 * Jangan pernah dipakai untuk data yang bisa diakses lewat client user biasa.
 */
export function createSupabaseAdminClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_URL dan SUPABASE_SECRET_KEY belum diisi untuk lingkungan ini.");
  }
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
