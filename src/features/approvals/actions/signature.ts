"use server";

import { adminActionClient, authActionClient } from "@/lib/safe-action";
import {
  registerFingerprintSchema,
  resetFingerprintSchema,
  signatureRequestSchema,
} from "../schemas/approval";
import {
  completeRegistration,
  registrationOptions,
  revokeCredential,
  signatureOptions,
} from "../server/webauthn";

export const fingerprintOptionsAction = authActionClient.action(async ({ ctx }) => {
  const options = await registrationOptions({
    id: ctx.userId,
    email: ctx.email,
    fullName: ctx.email,
  });
  return { options };
});

export const registerFingerprintAction = authActionClient
  .inputSchema(registerFingerprintSchema)
  .action(async ({ parsedInput, ctx }) => {
    await completeRegistration(ctx.userId, parsedInput.response, parsedInput.deviceLabel ?? null);
    return { ok: true as const };
  });

export const signatureOptionsAction = authActionClient
  .inputSchema(signatureRequestSchema)
  .action(async ({ parsedInput, ctx }) => ({
    options: await signatureOptions(ctx.userId, parsedInput),
  }));

export const resetFingerprintAction = adminActionClient
  .inputSchema(resetFingerprintSchema)
  .action(async ({ parsedInput, ctx }) => {
    await revokeCredential(ctx.userId, parsedInput.userId);
    return { ok: true as const };
  });
