/** Persetujuan digital (CLAUDE.md bagian 8). Sama dengan enum Postgres approval_decision dan approval_doc_type. */
export const APPROVAL_DECISIONS = ["disetujui", "ditolak"] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export const APPROVAL_DOC_TYPES = ["absen_luar_lokasi"] as const;
export type ApprovalDocType = (typeof APPROVAL_DOC_TYPES)[number];

export const APPROVAL_DOC_LABEL: Record<ApprovalDocType, string> = {
  absen_luar_lokasi: "Absen di luar lokasi",
};

export const APPROVAL_DECISION_LABEL: Record<ApprovalDecision, string> = {
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export const SIGNATURE_METHOD_LABEL = {
  biometrik: "Sidik jari perangkat terdaftar",
  cadangan: "Password (metode cadangan)",
  password: "Password",
} as const;

export const SIGNATURE_ATTEMPTS = 5;

export function verificationPath(code: string): string {
  return `/verifikasi/${code}`;
}

export function carriesCompanyStamp(decision: ApprovalDecision): boolean {
  return decision === "disetujui";
}
