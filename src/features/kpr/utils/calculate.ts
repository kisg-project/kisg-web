// Rumus simulasi KPR. Fungsi yang sama dipakai website, landing page, dan tool calculate_kpr di chat (Fase 7).
// Hasil bersifat estimasi. Angka akhir mengikuti ketentuan bank.

import type { KprKonvensionalInput, KprSyariahInput } from "../schemas/kpr";

/** Cicilan anuitas per bulan untuk pinjaman `principal`, bunga per bulan `monthlyRate`, `months` bulan. */
export function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) throw new RangeError("Jumlah bulan harus lebih dari nol.");
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
}

/** Sisa pokok setelah `paidMonths` kali membayar cicilan anuitas `payment`. */
export function remainingBalance(
  principal: number,
  monthlyRate: number,
  payment: number,
  paidMonths: number,
): number {
  if (monthlyRate === 0) return Math.max(0, principal - payment * paidMonths);
  const growth = (1 + monthlyRate) ** paidMonths;
  return Math.max(0, principal * growth - (payment * (growth - 1)) / monthlyRate);
}

export interface KprKonvensionalResult {
  loanAmount: number;
  downPayment: number;
  /** Cicilan per bulan selama masa fixed (atau seluruh tenor kalau tanpa masa floating). */
  monthlyFixed: number;
  fixedMonths: number;
  /** Perkiraan cicilan setelah masa fixed. null kalau masa fixed sama dengan tenor. */
  monthlyFloating: number | null;
  floatingMonths: number;
  totalPayment: number;
  totalInterest: number;
}

/**
 * KPR konvensional: bunga fixed selama `fixedYears`, lalu floating untuk sisa tenor.
 * Cicilan floating dihitung ulang dari sisa pokok dengan bunga floating (anuitas).
 */
export function calculateKprKonvensional(input: KprKonvensionalInput): KprKonvensionalResult {
  const loanAmount = input.price - input.downPayment;
  const totalMonths = input.tenorYears * 12;
  const fixedMonths = Math.min(input.fixedYears * 12, totalMonths);
  const floatingMonths = totalMonths - fixedMonths;
  const fixedRate = input.fixedRatePercent / 100 / 12;
  const floatingRate = input.floatingRatePercent / 100 / 12;

  // Tanpa masa fixed, seluruh tenor memakai bunga floating.
  const firstRate = fixedMonths > 0 ? fixedRate : floatingRate;
  const monthlyFixed = annuityPayment(loanAmount, firstRate, totalMonths);

  let monthlyFloating: number | null = null;
  if (fixedMonths > 0 && floatingMonths > 0) {
    const balance = remainingBalance(loanAmount, fixedRate, monthlyFixed, fixedMonths);
    monthlyFloating = annuityPayment(balance, floatingRate, floatingMonths);
  }

  const totalPayment =
    fixedMonths > 0
      ? monthlyFixed * fixedMonths + (monthlyFloating ?? 0) * floatingMonths
      : monthlyFixed * totalMonths;

  return {
    loanAmount,
    downPayment: input.downPayment,
    monthlyFixed: Math.round(monthlyFixed),
    fixedMonths: fixedMonths > 0 ? fixedMonths : totalMonths,
    monthlyFloating: monthlyFloating === null ? null : Math.round(monthlyFloating),
    floatingMonths: monthlyFloating === null ? 0 : floatingMonths,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalPayment - loanAmount),
  };
}

export interface KprSyariahResult {
  financingAmount: number;
  downPayment: number;
  /** Angsuran tetap per bulan sampai lunas. */
  monthly: number;
  months: number;
  totalMargin: number;
  totalPayment: number;
}

/**
 * KPR syariah akad murabahah dengan margin flat per tahun:
 * total margin = pembiayaan x margin x tenor, angsuran tetap = (pembiayaan + total margin) / jumlah bulan.
 */
export function calculateKprSyariah(input: KprSyariahInput): KprSyariahResult {
  const financingAmount = input.price - input.downPayment;
  const months = input.tenorYears * 12;
  const totalMargin = financingAmount * (input.marginPercent / 100) * input.tenorYears;
  const totalPayment = financingAmount + totalMargin;
  return {
    financingAmount,
    downPayment: input.downPayment,
    monthly: Math.round(totalPayment / months),
    months,
    totalMargin: Math.round(totalMargin),
    totalPayment: Math.round(totalPayment),
  };
}

/** Uang muka dari persen harga, dibulatkan ke rupiah. */
export function downPaymentFromPercent(price: number, percent: number): number {
  return Math.round((price * percent) / 100);
}

/** Persen uang muka dari nominal, satu desimal. */
export function downPaymentPercent(price: number, downPayment: number): number {
  if (price <= 0) return 0;
  return Math.round((downPayment / price) * 1000) / 10;
}
