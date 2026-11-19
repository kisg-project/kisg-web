import { describe, expect, it } from "vitest";
import { kprKonvensionalSchema, kprSyariahSchema } from "../schemas/kpr";
import {
  annuityPayment,
  calculateKprKonvensional,
  calculateKprSyariah,
  downPaymentFromPercent,
  downPaymentPercent,
  remainingBalance,
} from "./calculate";

// Nilai acuan dihitung terpisah (skrip Python dengan rumus anuitas standar), bukan dari fungsi ini.
const PRICE = 571_250_000;
const DP = 57_125_000;

describe("annuityPayment", () => {
  it("cocok dengan contoh buku teks: Rp 100 juta, 1% per bulan, 12 bulan", () => {
    expect(Math.round(annuityPayment(100_000_000, 0.01, 12))).toBe(8_884_879);
  });

  it("bunga 0% membagi rata pokok", () => {
    expect(annuityPayment(120_000_000, 0, 12)).toBe(10_000_000);
  });

  it("pinjaman nol menghasilkan cicilan nol", () => {
    expect(annuityPayment(0, 0.01, 12)).toBe(0);
  });

  it("menolak jumlah bulan nol", () => {
    expect(() => annuityPayment(1, 0.01, 0)).toThrow(RangeError);
  });
});

describe("remainingBalance", () => {
  it("sisa pokok nol setelah seluruh cicilan dibayar", () => {
    const payment = annuityPayment(100_000_000, 0.01, 12);
    expect(Math.round(remainingBalance(100_000_000, 0.01, payment, 12))).toBe(0);
  });

  it("bunga 0% mengurangi pokok secara linear", () => {
    expect(remainingBalance(120_000_000, 0, 10_000_000, 3)).toBe(90_000_000);
  });
});

describe("calculateKprKonvensional", () => {
  const base = {
    price: PRICE,
    downPayment: DP,
    tenorYears: 15,
    fixedRatePercent: 7.5,
    fixedYears: 3,
    floatingRatePercent: 11,
  };

  it("menghitung cicilan fixed, sisa pokok, dan cicilan floating", () => {
    expect(calculateKprKonvensional(base)).toEqual({
      loanAmount: 514_125_000,
      downPayment: DP,
      monthlyFixed: 4_766_002,
      fixedMonths: 36,
      monthlyFloating: 5_661_769,
      floatingMonths: 144,
      totalPayment: 986_870_767,
      totalInterest: 472_745_767,
    });
  });

  it("masa fixed sama dengan tenor: tidak ada cicilan floating", () => {
    const result = calculateKprKonvensional({ ...base, fixedYears: 15 });
    expect(result.monthlyFixed).toBe(4_766_002);
    expect(result.monthlyFloating).toBeNull();
    expect(result.totalPayment).toBe(857_880_413);
  });

  it("tanpa masa fixed: seluruh tenor memakai bunga floating", () => {
    const result = calculateKprKonvensional({ ...base, fixedYears: 0 });
    expect(result.monthlyFixed).toBe(5_843_529);
    expect(result.fixedMonths).toBe(180);
    expect(result.monthlyFloating).toBeNull();
  });
});

describe("calculateKprSyariah", () => {
  it("murabahah margin flat: angsuran tetap sampai lunas", () => {
    expect(
      calculateKprSyariah({ price: PRICE, downPayment: DP, tenorYears: 15, marginPercent: 5 }),
    ).toEqual({
      financingAmount: 514_125_000,
      downPayment: DP,
      monthly: 4_998_438,
      months: 180,
      totalMargin: 385_593_750,
      totalPayment: 899_718_750,
    });
  });
});

describe("uang muka", () => {
  it("mengubah persen ke nominal dan sebaliknya", () => {
    expect(downPaymentFromPercent(PRICE, 10)).toBe(DP);
    expect(downPaymentPercent(PRICE, DP)).toBe(10);
    expect(downPaymentPercent(0, 1)).toBe(0);
  });
});

describe("schema KPR", () => {
  it("menerima masukan valid", () => {
    expect(
      kprKonvensionalSchema.safeParse({
        price: PRICE,
        downPayment: DP,
        tenorYears: 15,
        fixedRatePercent: 7.5,
        fixedYears: 3,
        floatingRatePercent: 11,
      }).success,
    ).toBe(true);
  });

  it("menolak masa fixed lebih lama dari tenor dengan pesan di field yang benar", () => {
    const result = kprKonvensionalSchema.safeParse({
      price: PRICE,
      downPayment: DP,
      tenorYears: 5,
      fixedRatePercent: 7.5,
      fixedYears: 10,
      floatingRatePercent: 11,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["fixedYears"],
      message: "Masa fixed tidak boleh lebih lama dari tenor.",
    });
  });

  it("menolak uang muka di atas 90% dan harga di bawah batas", () => {
    const result = kprSyariahSchema.safeParse({
      price: 10_000_000,
      downPayment: 9_500_000,
      tenorYears: 10,
      marginPercent: 5,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["price", "downPayment"]),
    );
  });

  it("menolak tenor di luar batas dan margin negatif", () => {
    const result = kprSyariahSchema.safeParse({
      price: PRICE,
      downPayment: DP,
      tenorYears: 40,
      marginPercent: -1,
    });
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      "tenorYears",
      "marginPercent",
    ]);
  });
});
