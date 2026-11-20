import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

/** Client Supabase dengan sesi user dari cookie. Untuk Server Component, server action, route handler. */
export async function createSupabaseServerClient() {
  // cookies() dulu: saat prerender, halaman berhenti di sini sebagai bagian dinamis, jadi env Supabase
  // tidak dibutuhkan saat build.
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component tidak bisa menulis cookie. proxy.ts yang menyegarkan sesi di setiap request.
        }
      },
    },
  });
}
