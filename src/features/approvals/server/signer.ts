import "server-only";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import {
  SIGNATURE_ATTEMPTS,
  type ApprovalDecision,
  type ApprovalDocType,
} from "@/config/approvals";
import { ActionError } from "@/lib/safe-action";
import { hitRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { activeCredential, verifySignature } from "./webauthn";

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

export async function signerUserAgent(): Promise<string | null> {
  const value = (await headers()).get("user-agent");
  return value ? value.slice(0, 500) : null;
}

export interface ConfirmedSignature {
  method: "biometrik" | "cadangan";
  credentialId: string | null;
}

export async function confirmSignature(
  signer: { userId: string; email: string },
  signature: {
    method: "biometrik" | "cadangan";
    password?: string;
    response?: AuthenticationResponseJSON;
  },
  doc: { docType: ApprovalDocType; docId: string; decision: ApprovalDecision },
): Promise<ConfirmedSignature> {
  if (!(await activeCredential(signer.userId))) {
    throw new ActionError("Daftarkan sidik jari dulu di Akun saya sebelum menyetujui.");
  }
  if (signature.method === "biometrik") {
    if (!signature.response) throw new ActionError("Sentuh sidik jari dulu untuk menandatangani.");
    const credentialId = await verifySignature(signer.userId, doc, signature.response);
    return { method: "biometrik", credentialId };
  }
  await confirmSignerPassword({ ...signer, password: signature.password ?? "" });
  return { method: "cadangan", credentialId: null };
}
