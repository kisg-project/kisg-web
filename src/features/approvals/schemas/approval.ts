import { z } from "zod";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/browser";
import { APPROVAL_DECISIONS, APPROVAL_DOC_TYPES } from "@/config/approvals";

const isObjectWith = (value: unknown, keys: string[]) =>
  typeof value === "object" && value !== null && keys.every((key) => key in value);

export const authenticationResponseSchema = z.custom<AuthenticationResponseJSON>(
  (value) => isObjectWith(value, ["id", "rawId", "response", "type"]),
  "Data sidik jari tidak lengkap. Ulangi sekali lagi.",
);

export const registrationResponseSchema = z.custom<RegistrationResponseJSON>(
  (value) => isObjectWith(value, ["id", "rawId", "response", "type"]),
  "Data perangkat tidak lengkap. Ulangi sekali lagi.",
);

export const signatureFields = {
  method: z.enum(["biometrik", "cadangan"]),
  password: z.string().optional(),
  response: authenticationResponseSchema.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
};

export function refineSignature(
  value: { method: "biometrik" | "cadangan"; password?: string; response?: unknown },
  context: z.RefinementCtx,
) {
  if (value.method === "cadangan" && !value.password) {
    context.addIssue({
      code: "custom",
      path: ["password"],
      message: "Masukkan password akun Anda.",
    });
  }
  if (value.method === "biometrik" && !value.response) {
    context.addIssue({
      code: "custom",
      path: ["response"],
      message: "Sentuh sidik jari dulu untuk menandatangani.",
    });
  }
}

export const signatureSchema = z.object(signatureFields).superRefine(refineSignature);
export type SignatureInput = z.input<typeof signatureSchema>;

export const signatureRequestSchema = z.object({
  docType: z.enum(APPROVAL_DOC_TYPES),
  docId: z.uuid(),
  decision: z.enum(APPROVAL_DECISIONS),
});

export const registerFingerprintSchema = z.object({
  response: registrationResponseSchema,
  deviceLabel: z.string().trim().max(120).optional(),
});

export const resetFingerprintSchema = z.object({ userId: z.uuid() });
