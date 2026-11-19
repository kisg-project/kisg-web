// Mesin simulasi KPR. Dipakai website, landing page, PDF, dan tool calculate_kpr di chat (Fase 7).
// Konvensional dan syariah memakai rumus anuitas yang sama dengan periode bertingkat:
// - konvensional: bunga fixed (bisa berjenjang), lalu bunga floating sampai lunas
// - syariah: margin setara efektif per tahun, cara bank syariah mengutip margin (misal "margin setara 2,75%")
// Setiap awal periode, angsuran dihitung ulang dari sisa pokok untuk sisa jangka waktu.
// Hasil bersifat estimasi. Angka akhir mengikuti ketentuan bank.

export interface RateSegment {
  /** Bunga atau margin per tahun, dalam persen. */
  ratePercent: number;
  years: number;
}

export interface KprInput {
  price: number;
  downPayment: number;
  tenorYears: number;
  /** Periode tetap berurutan (fixed atau berjenjang). Boleh kosong. */
  segments: readonly RateSegment[];
  /** Bunga atau margin untuk sisa jangka waktu setelah semua periode tetap. */
  afterRatePercent: number;
}

export interface KprPeriod {
  ratePercent: number;
  fromMonth: number;
  toMonth: number;
  monthly: number;
  /** true untuk periode setelah semua periode tetap (floating). */
  isAfter: boolean;
}

export interface KprMonthRow {
  month: number;
  ratePercent: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface KprYearRow {
  year: number;
  /** Angsuran per bulan di tahun itu (bulan terakhir tahun tersebut). */
  monthly: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export interface KprResult {
  loanAmount: number;
  downPayment: number;
  months: number;
  periods: KprPeriod[];
  totalPayment: number;
  /** Total bunga (konvensional) atau total margin (syariah). */
  totalInterest: number;
  schedule: KprMonthRow[];
  yearly: KprYearRow[];
}

/** Angsuran anuitas per bulan untuk pokok `principal`, tarif per bulan `monthlyRate`, `months` bulan. */
export function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) throw new RangeError("Jumlah bulan harus lebih dari nol.");
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
}

export function calculateKpr(input: KprInput): KprResult {
  const loanAmount = input.price - input.downPayment;
  const months = input.tenorYears * 12;
  const periods: KprPeriod[] = [];
  const schedule: KprMonthRow[] = [];
  let balance = loanAmount;
  let month = 0;

  const runPeriod = (ratePercent: number, length: number, isAfter: boolean) => {
    const rate = ratePercent / 100 / 12;
    const payment = annuityPayment(balance, rate, months - month);
    periods.push({
      ratePercent,
      fromMonth: month + 1,
      toMonth: month + length,
      monthly: Math.round(payment),
      isAfter,
    });
    for (let index = 0; index < length; index += 1) {
      const interest = balance * rate;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      month += 1;
      schedule.push({ month, ratePercent, payment, principal, interest, balance });
    }
  };

  for (const segment of input.segments) {
    const length = Math.min(segment.years * 12, months - month);
    if (length <= 0) break;
    runPeriod(segment.ratePercent, length, false);
  }
  if (month < months) runPeriod(input.afterRatePercent, months - month, true);

  const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);
  const yearly: KprYearRow[] = [];
  for (let start = 0; start < schedule.length; start += 12) {
    const rows = schedule.slice(start, start + 12);
    const last = rows.at(-1);
    if (!last) break;
    yearly.push({
      year: start / 12 + 1,
      monthly: Math.round(last.payment),
      principalPaid: Math.round(rows.reduce((sum, row) => sum + row.principal, 0)),
      interestPaid: Math.round(rows.reduce((sum, row) => sum + row.interest, 0)),
      endingBalance: Math.round(last.balance),
    });
  }

  return {
    loanAmount,
    downPayment: input.downPayment,
    months,
    periods,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalPayment - loanAmount),
    schedule,
    yearly,
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
