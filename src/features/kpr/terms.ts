// Istilah per skema. Tab syariah memakai istilah pembiayaan syariah (margin, pembiayaan, angsuran,
// harga jual bank, nasabah), tanpa kata "bunga", "cicilan", atau "pinjaman".

import type { KprScheme } from "@/config/kpr-products";

export interface KprTerms {
  title: string;
  /** Untuk pesan validasi schema. */
  rateLabel: "Bunga" | "Margin";
  rate: string;
  rateLower: string;
  principal: string;
  installment: string;
  installmentLower: string;
  fixedPeriods: string;
  fixedUntilEnd: string;
  afterRate: string;
  totalInterest: string;
  totalPayment: string;
  tenor: string;
  customer: string;
  programLabel: string;
  interestPaid: string;
  schemeNote: string;
}

export const KPR_TERMS: Record<KprScheme, KprTerms> = {
  konvensional: {
    title: "KPR Konvensional",
    rateLabel: "Bunga",
    rate: "Bunga",
    rateLower: "bunga",
    principal: "Pokok pinjaman",
    installment: "Cicilan",
    installmentLower: "cicilan",
    fixedPeriods: "Periode bunga fixed",
    fixedUntilEnd: "Bunga fixed sampai lunas",
    afterRate: "Bunga floating setelah masa fixed (asumsi)",
    totalInterest: "Total bunga",
    totalPayment: "Total pembayaran cicilan",
    tenor: "Jangka waktu kredit",
    customer: "debitur",
    programLabel: "Program KPR",
    interestPaid: "Bunga dibayar",
    schemeNote:
      "Bunga fixed berlaku selama masa fixed. Setelah itu bunga mengikuti suku bunga floating bank, sehingga cicilan bisa berubah.",
  },
  syariah: {
    title: "KPR Syariah",
    rateLabel: "Margin",
    rate: "Margin",
    rateLower: "margin",
    principal: "Pokok pembiayaan",
    installment: "Angsuran",
    installmentLower: "angsuran",
    fixedPeriods: "Periode margin tetap",
    fixedUntilEnd: "Margin tetap sampai lunas",
    afterRate: "Margin setelah periode tetap (asumsi)",
    totalInterest: "Total margin (keuntungan bank)",
    totalPayment: "Harga jual bank (pokok + margin)",
    tenor: "Jangka waktu pembiayaan",
    customer: "nasabah",
    programLabel: "Program pembiayaan",
    interestPaid: "Margin dibayar",
    schemeNote:
      "Margin disepakati di awal akad. Pada akad murabahah dengan margin tetap sampai lunas, angsuran tidak berubah sampai pembiayaan selesai.",
  },
};

/** Ringkasan akad untuk edukasi di tab syariah. */
export const AKAD_INFO = [
  {
    name: "Murabahah",
    text: "Akad jual beli. Bank membeli rumah, lalu menjualnya kepada nasabah seharga pokok ditambah margin yang disepakati di awal. Angsuran tetap sampai lunas.",
  },
  {
    name: "Musyarakah Mutanaqisah (MMQ)",
    text: "Rumah dimiliki bersama oleh bank dan nasabah. Nasabah membeli bagian bank sedikit demi sedikit sambil membayar sewa (ujrah) atas bagian bank. Ujrah dapat ditinjau ulang secara berkala.",
  },
  {
    name: "Istishna",
    text: "Akad pemesanan pembuatan rumah dengan spesifikasi yang disepakati. Cocok untuk rumah inden yang dibangun setelah akad.",
  },
  {
    name: "IMBT (Ijarah Muntahiyah Bittamlik)",
    text: "Akad sewa yang diakhiri dengan perpindahan kepemilikan rumah kepada nasabah di akhir masa sewa.",
  },
] as const;
