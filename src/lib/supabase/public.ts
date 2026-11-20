import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

/**
 * Client tanpa sesi untuk membaca konten publik (website). Memakai publishable key, jadi hanya baris
 * yang lolos RLS untuk anon yang terbaca. Aman dipakai di fungsi "use cache" karena tidak membaca cookie.
 */
export function createSupabasePublicClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
