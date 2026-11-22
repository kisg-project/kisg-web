import "server-only";

export { confirmSignature, confirmSignerPassword, signerUserAgent } from "./server/signer";
export { activeCredential, type ActiveCredential } from "./server/webauthn";
export { verifyApproval, type ApprovalVerification } from "./queries/verify";
