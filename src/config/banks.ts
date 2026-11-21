// Bank rekanan KPR (permintaan owner, 19 November 2026). Logo dari Wikimedia Commons:
// hak cipta public domain, tetapi tetap merek dagang bank masing-masing. Hanya tampil untuk bank
// yang benar-benar bekerja sama dengan KIS (konfirmasi owner di docs/TODO-DATA.md).
// BTN Syariah sudah menjadi Bank Syariah Nasional (BSN) sejak Desember 2025.

export interface PartnerBank {
  key: "btn" | "mandiri" | "bsi" | "bsn";
  name: string;
  /** null: logo belum tersedia (BSN), nama bank tampil sebagai teks. */
  logo: { src: string; width: number; height: number } | null;
  /** Jenis KPR yang tersedia di bank ini. */
  schemes: readonly ("konvensional" | "syariah")[];
}

export const PARTNER_BANKS: readonly PartnerBank[] = [
  {
    key: "btn",
    name: "Bank BTN",
    logo: { src: "/images/banks/bank-btn.svg", width: 466, height: 261 },
    schemes: ["konvensional"],
  },
  {
    key: "mandiri",
    name: "Bank Mandiri",
    logo: { src: "/images/banks/bank-mandiri.svg", width: 600, height: 175 },
    schemes: ["konvensional"],
  },
  {
    key: "bsi",
    name: "Bank Syariah Indonesia (BSI)",
    logo: { src: "/images/banks/bank-bsi.svg", width: 1355, height: 377 },
    schemes: ["syariah"],
  },
  {
    key: "bsn",
    name: "Bank Syariah Nasional (BSN)",
    // Logo resmi dari owner (21 November 2026).
    logo: { src: "/images/banks/bank-bsn.png", width: 297, height: 229 },
    schemes: ["syariah"],
  },
];

export function bankByKey(key: PartnerBank["key"]): PartnerBank {
  const bank = PARTNER_BANKS.find((item) => item.key === key);
  if (!bank) throw new Error(`Bank ${key} tidak ada di PARTNER_BANKS.`);
  return bank;
}
