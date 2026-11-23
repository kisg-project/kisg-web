export const LEAD_STAGES = [
  "baru",
  "dihubungi",
  "prospek",
  "jadwal_survei",
  "sudah_survei",
  "negosiasi",
  "booking_fee",
  "proses_berkas",
  "akad",
  "batal",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  baru: "Baru",
  dihubungi: "Dihubungi",
  prospek: "Prospek",
  jadwal_survei: "Jadwal survei",
  sudah_survei: "Sudah survei",
  negosiasi: "Negosiasi",
  booking_fee: "Booking fee",
  proses_berkas: "Proses berkas",
  akad: "Akad",
  batal: "Batal",
};

export const LEAD_STAGE_TONE: Record<LeadStage, string> = {
  baru: "bg-info-100 text-info-800",
  dihubungi: "bg-violet-100 text-violet-700",
  prospek: "bg-violet-100 text-violet-700",
  jadwal_survei: "bg-orange-100 text-orange-700",
  sudah_survei: "bg-orange-100 text-orange-700",
  negosiasi: "bg-warning-100 text-warning-800",
  booking_fee: "bg-primary-100 text-primary-700",
  proses_berkas: "bg-primary-100 text-primary-700",
  akad: "bg-success-100 text-success-800",
  batal: "bg-danger-100 text-danger-700",
};

export const LEAD_SOURCES = [
  "website",
  "landing_page",
  "meta_lead_ads",
  "chat",
  "manual",
  "walk_in",
  "instagram",
  "whatsapp",
  "referral",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  website: "Website",
  landing_page: "Landing page",
  meta_lead_ads: "Iklan Meta",
  chat: "Chat Jaka",
  manual: "Input marketing",
  walk_in: "Datang ke kantor",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  referral: "Referensi",
};

export const MANUAL_LEAD_SOURCES = [
  "manual",
  "walk_in",
  "instagram",
  "whatsapp",
  "referral",
] as const satisfies readonly LeadSource[];

export const LEAD_ACTIVITY_TYPES = [
  "telepon",
  "whatsapp",
  "email",
  "survei",
  "pertemuan",
  "catatan",
  "perubahan_tahap",
  "dokumen",
  "sistem",
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

export const LEAD_ACTIVITY_LABEL: Record<LeadActivityType, string> = {
  telepon: "Telepon",
  whatsapp: "WhatsApp",
  email: "Email",
  survei: "Survei",
  pertemuan: "Pertemuan",
  catatan: "Catatan",
  perubahan_tahap: "Tahap berubah",
  dokumen: "Dokumen",
  sistem: "Sistem",
};

export const LOGGABLE_ACTIVITIES = [
  "telepon",
  "whatsapp",
  "survei",
  "pertemuan",
  "catatan",
] as const satisfies readonly LeadActivityType[];

export const LEAD_ASSIGNMENT_REASONS = [
  "giliran",
  "manual",
  "sla_lewat",
  "tanpa_marketing",
  "dibuat_sendiri",
] as const;
export type LeadAssignmentReason = (typeof LEAD_ASSIGNMENT_REASONS)[number];

export const LEAD_ASSIGNMENT_LABEL: Record<LeadAssignmentReason, string> = {
  giliran: "Dibagi bergiliran",
  manual: "Dipindah manajer",
  sla_lewat: "Lewat batas respons, kembali ke antrean",
  tanpa_marketing: "Masuk antrean, tidak ada marketing yang bertugas",
  dibuat_sendiri: "Diinput marketing",
};

export const CRM_MANAGER_ROLES = ["owner", "admin", "marketing_manager"] as const;
export const DEFAULT_SLA_MINUTES = 30;
