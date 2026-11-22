import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import type { ApprovalDecision, ApprovalDocType } from "@/config/approvals";
import { ActionError } from "@/lib/safe-action";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RP_NAME = "KIS Operasional";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

async function relyingParty(): Promise<{ rpID: string; origin: string }> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { rpID: host.split(":")[0] ?? host, origin: `${proto}://${host}` };
}

const toBase64Url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const fromBase64Url = (text: string) => new Uint8Array(Buffer.from(text, "base64url"));

function challengeFromClient(clientDataJSON: string): string | null {
  try {
    const parsed = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf8")) as {
      challenge?: unknown;
    };
    return typeof parsed.challenge === "string" ? parsed.challenge : null;
  } catch {
    return null;
  }
}

async function storeChallenge(
  userId: string,
  purpose: "daftar" | "tanda_tangan",
  challenge: string,
  payload: Record<string, string>,
) {
  const { error } = await createSupabaseAdminClient()
    .from("webauthn_challenges")
    .insert({
      user_id: userId,
      purpose,
      challenge,
      payload,
      expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
    });
  if (error) throw new Error(`Tantangan gagal disimpan: ${error.message}`);
}

async function consumeChallenge(
  userId: string,
  purpose: "daftar" | "tanda_tangan",
  challenge: string,
) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("webauthn_challenges")
    .update({ used_at: new Date().toISOString() })
    .eq("challenge", challenge)
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("payload")
    .maybeSingle();
  if (!data) throw new ActionError("Waktu verifikasi habis. Ulangi sekali lagi.");
  return data.payload as Record<string, string>;
}

export interface ActiveCredential {
  credentialId: string;
  deviceLabel: string | null;
  createdAt: string;
}

export async function activeCredential(userId: string): Promise<ActiveCredential | null> {
  const { data } = await createSupabaseAdminClient()
    .from("webauthn_credentials")
    .select("credential_id, device_label, created_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  return data
    ? {
        credentialId: data.credential_id,
        deviceLabel: data.device_label,
        createdAt: data.created_at,
      }
    : null;
}

export async function registrationOptions(user: {
  id: string;
  email: string;
  fullName: string;
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  if (await activeCredential(user.id)) {
    throw new ActionError("Sidik jari sudah terdaftar. Hubungi Direktur Utama untuk reset.");
  }
  const { rpID } = await relyingParty();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email,
    userDisplayName: user.fullName || user.email,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
  });
  await storeChallenge(user.id, "daftar", options.challenge, {});
  return options;
}

export async function completeRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  deviceLabel: string | null,
): Promise<void> {
  const challenge = challengeFromClient(response.response.clientDataJSON);
  if (!challenge) throw new ActionError("Data perangkat tidak lengkap. Ulangi sekali lagi.");
  await consumeChallenge(userId, "daftar", challenge);
  const { rpID, origin } = await relyingParty();
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  }).catch(() => ({ verified: false as const }));
  if (!verification.verified) {
    throw new ActionError("Sidik jari belum terverifikasi. Ulangi sekali lagi.");
  }
  const { credential } = verification.registrationInfo;
  const { error } = await createSupabaseAdminClient()
    .from("webauthn_credentials")
    .insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: toBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      device_label: deviceLabel?.slice(0, 120) ?? null,
    });
  if (error) {
    if (error.code === "23505") {
      throw new ActionError("Sidik jari sudah terdaftar. Hubungi Direktur Utama untuk reset.");
    }
    throw new Error(`Kunci sidik jari gagal disimpan: ${error.message}`);
  }
}

async function documentHash(docType: ApprovalDocType, docId: string): Promise<string> {
  const { data, error } = await createSupabaseAdminClient().rpc("document_hash", {
    p_doc_type: docType,
    p_doc_id: docId,
  });
  if (error || !data) throw new ActionError("Dokumen tidak ditemukan.");
  return data;
}

export async function signatureOptions(
  userId: string,
  doc: { docType: ApprovalDocType; docId: string; decision: ApprovalDecision },
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const credential = await createSupabaseAdminClient()
    .from("webauthn_credentials")
    .select("credential_id, transports")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  if (!credential.data) {
    throw new ActionError("Sidik jari belum terdaftar. Daftarkan dulu di Akun saya.");
  }
  const contentHash = await documentHash(doc.docType, doc.docId);
  const challenge = createHash("sha256")
    .update(`${contentHash}|${doc.decision}|${randomBytes(16).toString("hex")}`)
    .digest("base64url");
  const { rpID } = await relyingParty();
  const options = await generateAuthenticationOptions({
    rpID,
    challenge,
    userVerification: "required",
    allowCredentials: [
      { id: credential.data.credential_id, transports: credential.data.transports },
    ],
  });
  await storeChallenge(userId, "tanda_tangan", options.challenge, {
    docType: doc.docType,
    docId: doc.docId,
    decision: doc.decision,
    contentHash,
  });
  return options;
}

export async function verifySignature(
  userId: string,
  doc: { docType: ApprovalDocType; docId: string; decision: ApprovalDecision },
  response: AuthenticationResponseJSON,
): Promise<string> {
  const challenge = challengeFromClient(response.response.clientDataJSON);
  if (!challenge) throw new ActionError("Data perangkat tidak lengkap. Ulangi sekali lagi.");
  const payload = await consumeChallenge(userId, "tanda_tangan", challenge);
  if (
    payload.docType !== doc.docType ||
    payload.docId !== doc.docId ||
    payload.decision !== doc.decision
  ) {
    throw new ActionError("Tanda tangan bukan untuk pengajuan ini. Ulangi sekali lagi.");
  }
  if (payload.contentHash !== (await documentHash(doc.docType, doc.docId))) {
    throw new ActionError("Isi pengajuan berubah. Muat ulang halaman, lalu ulangi.");
  }
  const admin = createSupabaseAdminClient();
  const { data: stored } = await admin
    .from("webauthn_credentials")
    .select("credential_id, public_key, counter, transports")
    .eq("user_id", userId)
    .eq("credential_id", response.id)
    .is("revoked_at", null)
    .maybeSingle();
  if (!stored) throw new ActionError("Sidik jari ini tidak terdaftar untuk akun Anda.");
  const { rpID, origin } = await relyingParty();
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: stored.credential_id,
      publicKey: fromBase64Url(stored.public_key),
      counter: stored.counter,
      transports: stored.transports,
    },
  }).catch(() => null);
  if (!verification?.verified) {
    throw new ActionError("Sidik jari tidak cocok. Ulangi sekali lagi.");
  }
  await admin
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", stored.credential_id);
  return stored.credential_id;
}

export async function revokeCredential(actorId: string, userId: string): Promise<void> {
  const { data, error } = await createSupabaseAdminClient()
    .from("webauthn_credentials")
    .update({ revoked_at: new Date().toISOString(), revoked_by: actorId })
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw new Error(`Reset sidik jari gagal: ${error.message}`);
  if (!data.length) throw new ActionError("Karyawan ini belum mendaftarkan sidik jari.");
}
