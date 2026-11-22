import "server-only";
import { z } from "zod";
import { APPROVAL_DECISIONS, APPROVAL_DOC_TYPES } from "@/config/approvals";
import { APP_ROLES } from "@/config/roles";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const verificationSchema = z.object({
  doc_type: z.enum(APPROVAL_DOC_TYPES),
  document: z.string(),
  subject: z.string().nullable(),
  decision: z.enum(APPROVAL_DECISIONS),
  signer_name: z.string(),
  signer_role: z.enum(APP_ROLES),
  signed_at: z.string(),
  method: z.enum(["password", "biometrik", "cadangan"]).catch("password"),
  matches: z.boolean(),
});

export type ApprovalVerification = z.infer<typeof verificationSchema>;

export async function verifyApproval(code: string): Promise<ApprovalVerification | null> {
  if (!/^[0-9a-f]{64}$/.test(code)) return null;
  const { data, error } = await createSupabasePublicClient().rpc("verify_approval", {
    p_code: code,
  });
  if (error) throw new Error(`Verifikasi gagal: ${error.message}`);
  const parsed = verificationSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
