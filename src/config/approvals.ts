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

/** Percobaan password per penyetuju sebelum dikunci 15 menit. */
export const SIGNATURE_ATTEMPTS = 5;

/** Halaman verifikasi publik yang dibuka dari QR code. */
export function verificationPath(code: string): string {
  return `/verifikasi/${code}`;
}
