import "server-only";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SIGNATURE_ATTEMPTS } from "@/config/approvals";
import { ActionError } from "@/lib/safe-action";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Konfirmasi tanda tangan elektronik: password penyetuju diperiksa lewat klien Supabase terpisah
 * tanpa cookie (sesi yang dipakai tidak berubah). Dibatasi per akun.
 */
export async function confirmSignerPassword(signer: {
  userId: string;
  email: string;
  password: string;
}): Promise<void> {
  const allowed = await hitRateLimit("tanda-tangan", signer.userId, 15 * 60, SIGNATURE_ATTEMPTS);
  if (!allowed) throw new ActionError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
  const { url, publishableKey } = getSupabaseConfig();
  const verifier = createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await verifier.auth.signInWithPassword({
    email: signer.email,
    password: signer.password,
  });
  if (error || data.user.id !== signer.userId) {
    throw new ActionError("Password salah. Persetujuan belum disimpan.");
  }
  await verifier.auth.signOut({ scope: "local" });
}

/** User agent penyetuju untuk cap persetujuan. */
export async function signerUserAgent(): Promise<string | null> {
  const value = (await headers()).get("user-agent");
  return value ? value.slice(0, 500) : null;
}
