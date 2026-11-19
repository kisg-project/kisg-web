// Estimasi biaya di luar harga rumah yang dibayar pembeli saat akad.
// Harga Sejahtera Green Village sudah termasuk notaris jual beli, cek dan balik nama sertifikat, SSP, IMB, PBB
// (src/config/featured-project.ts). Yang dihitung di sini: BPHTB dan biaya bank, notaris bank, asuransi.

export interface CostInput {
  price: number;
  downPayment: number;
  /** Pokok pinjaman atau pembiayaan. */
  loanAmount: number;
  /** Nilai Perolehan Objek Pajak Tidak Kena Pajak (ditetapkan perda, bisa diubah). */
  npoptkp: number;
  /** Tarif BPHTB dalam persen (UU HKPD: paling tinggi 5%). */
  bphtbRatePercent: number;
  /** Perkiraan biaya bank, notaris bank, dan asuransi, persen dari pokok. */
  otherCostsPercent: number;
}

export interface CostResult {
  bphtb: number;
  otherCosts: number;
  totalCosts: number;
  /** Uang muka ditambah semua biaya: perkiraan dana yang disiapkan sebelum angsuran pertama. */
  firstPayment: number;
}

/** BPHTB = tarif x (nilai perolehan dikurangi NPOPTKP), tidak pernah negatif. */
export function calculateBphtb(price: number, npoptkp: number, ratePercent: number): number {
  return Math.round((Math.max(0, price - npoptkp) * ratePercent) / 100);
}

export function calculateCosts(input: CostInput): CostResult {
  const bphtb = calculateBphtb(input.price, input.npoptkp, input.bphtbRatePercent);
  const otherCosts = Math.round((input.loanAmount * input.otherCostsPercent) / 100);
  const totalCosts = bphtb + otherCosts;
  return { bphtb, otherCosts, totalCosts, firstPayment: input.downPayment + totalCosts };
}
