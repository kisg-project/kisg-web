// Akses Supabase lokal dari test (hanya di CI, CLAUDE.md bagian 5). Kunci diisi langkah CI
// .github/actions/supabase-local dari `supabase status`. Tidak pernah menyentuh staging atau production.

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} belum diisi. E2E portal butuh Supabase lokal (lihat ci.yml).`);
  }
  return value;
}

export function supabaseUrl(): string {
  const url = required("SUPABASE_URL");
  const host = new URL(url).hostname;
  // Pengaman: E2E hanya boleh ke Supabase lokal.
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("E2E portal hanya boleh memakai Supabase lokal.");
  }
  return url;
}

let admin: SupabaseClient<Database> | undefined;

/** Client service role untuk menyiapkan data test. */
export function adminClient(): SupabaseClient<Database> {
  admin ??= createClient<Database>(supabaseUrl(), required("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

export interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict" | "None";
}

/**
 * Login lewat API lalu mengembalikan cookie sesi dalam format @supabase/ssr, siap dipakai sebagai
 * storageState Playwright. Tidak lewat UI, jadi tidak terkena rate limit login.
 */
export async function sessionCookies(
  email: string,
  password: string,
  baseURL: string,
): Promise<BrowserCookie[]> {
  const jar = new Map<string, { value: string; maxAge?: number }>();
  const client = createServerClient<Database>(supabaseUrl(), required("SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll: () => [...jar].map(([name, cookie]) => ({ name, value: cookie.value })),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          if (value) jar.set(name, { value, maxAge: options.maxAge });
          else jar.delete(name);
        }
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login API gagal untuk ${email}: ${error.message}`);
  if (jar.size === 0) throw new Error("Cookie sesi tidak terbentuk.");

  const domain = new URL(baseURL).hostname;
  const now = Math.floor(Date.now() / 1000);
  return [...jar].map(([name, cookie]) => ({
    name,
    value: cookie.value,
    domain,
    path: "/",
    expires: cookie.maxAge ? now + cookie.maxAge : -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  }));
}
