import { describe, expect, it } from "vitest";
import { KPR_PRODUCTS, lowestRate, firstFixedYears, productsFor } from "@/config/kpr-products";
import { kprFormSchema } from "../schemas/kpr";
import {
  annuityPayment,
  calculateKpr,
  downPaymentFromPercent,
  downPaymentPercent,
} from "./calculate";
import { calculateBphtb, calculateCosts } from "./costs";

// Nilai acuan dihitung terpisah (skrip Python dengan rumus anuitas standar), bukan dari fungsi ini.
const PRICE = 571_250_000;
const DP = 57_125_000;
const base = { price: PRICE, downPayment: DP, tenorYears: 15 };

describe("annuityPayment", () => {
  it("cocok dengan contoh buku teks: Rp 100 juta, 1% per bulan, 12 bulan", () => {
    expect(Math.round(annuityPayment(100_000_000, 0.01, 12))).toBe(8_884_879);
  });

  it("tarif 0% membagi rata pokok, pokok nol menghasilkan nol", () => {
    expect(annuityPayment(120_000_000, 0, 12)).toBe(10_000_000);
    expect(annuityPayment(0, 0.01, 12)).toBe(0);
  });

  it("menolak jumlah bulan nol", () => {
    expect(() => annuityPayment(1, 0.01, 0)).toThrow(RangeError);
  });
});

describe("calculateKpr", () => {
  it("konvensional: fixed 7,5% 3 tahun lalu floating 11%", () => {
    const result = calculateKpr({
      ...base,
      segments: [{ ratePercent: 7.5, years: 3 }],
      afterRatePercent: 11,
    });
    expect(result.loanAmount).toBe(514_125_000);
    expect(result.periods).toEqual([
      { ratePercent: 7.5, fromMonth: 1, toMonth: 36, monthly: 4_766_002, isAfter: false },
      { ratePercent: 11, fromMonth: 37, toMonth: 180, monthly: 5_661_769, isAfter: true },
    ]);
    expect(result.totalPayment).toBe(986_870_767);
    expect(result.totalInterest).toBe(472_745_767);
  });

  it("bunga berjenjang Mandiri 4,06% lalu 8,76% lalu 9,76% lalu floating", () => {
    const result = calculateKpr({
      ...base,
      segments: [
        { ratePercent: 4.06, years: 3 },
        { ratePercent: 8.76, years: 3 },
        { ratePercent: 9.76, years: 4 },
      ],
      afterRatePercent: 11,
    });
    expect(result.periods.map((period) => period.monthly)).toEqual([
      3_818_397, 4_888_189, 5_082_395, 5_229_912,
    ]);
    expect(result.totalPayment).toBe(871_186_834);
  });

  it("syariah: margin setara 5% tetap sampai lunas, angsuran tidak berubah", () => {
    const result = calculateKpr({ ...base, segments: [], afterRatePercent: 5 });
    expect(result.periods).toEqual([
      { ratePercent: 5, fromMonth: 1, toMonth: 180, monthly: 4_065_668, isAfter: true },
    ]);
    expect(result.totalPayment).toBe(731_820_192);
    expect(result.totalInterest).toBe(217_695_192);
  });

  it("jadwal: 180 bulan, 15 baris tahunan, sisa pokok akhir nol", () => {
    const result = calculateKpr({
      ...base,
      segments: [{ ratePercent: 7.5, years: 3 }],
      afterRatePercent: 11,
    });
    expect(result.schedule).toHaveLength(180);
    expect(result.yearly).toHaveLength(15);
    expect(result.yearly.at(-1)?.endingBalance).toBe(0);
    const principal = result.yearly.reduce((sum, row) => sum + row.principalPaid, 0);
    expect(Math.abs(principal - result.loanAmount)).toBeLessThanOrEqual(15);
  });

  it("periode tetap lebih panjang dari tenor dipotong di akhir tenor", () => {
    const result = calculateKpr({
      ...base,
      tenorYears: 2,
      segments: [{ ratePercent: 5, years: 3 }],
      afterRatePercent: 11,
    });
    expect(result.periods).toHaveLength(1);
    expect(result.periods[0]?.toMonth).toBe(24);
  });

  it("tarif 0% sampai lunas", () => {
    const result = calculateKpr({ ...base, tenorYears: 1, segments: [], afterRatePercent: 0 });
    expect(result.totalInterest).toBe(0);
  });
});

describe("biaya", () => {
  it("BPHTB 5% x (harga - NPOPTKP), tidak negatif", () => {
    expect(calculateBphtb(PRICE, 80_000_000, 5)).toBe(24_562_500);
    expect(calculateBphtb(50_000_000, 80_000_000, 5)).toBe(0);
  });

  it("perkiraan dana awal = uang muka + BPHTB + biaya lain", () => {
    expect(
      calculateCosts({
        price: PRICE,
        downPayment: DP,
        loanAmount: PRICE - DP,
        npoptkp: 80_000_000,
        bphtbRatePercent: 5,
        otherCostsPercent: 3,
      }),
    ).toEqual({
      bphtb: 24_562_500,
      otherCosts: 15_423_750,
      totalCosts: 39_986_250,
      firstPayment: 97_111_250,
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

describe("schema form", () => {
  const schema = kprFormSchema("Margin");
  const valid = {
    ...base,
    segments: [{ ratePercent: 3.65, years: 1 }],
    afterRatePercent: 10,
    npoptkp: 80_000_000,
    otherCostsPercent: 3,
  };

  it("menerima masukan valid", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("menolak total periode tetap melebihi jangka waktu", () => {
    const result = schema.safeParse({
      ...valid,
      tenorYears: 2,
      segments: [{ ratePercent: 5, years: 3 }],
    });
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Total periode tetap tidak boleh lebih lama dari jangka waktu.",
    );
  });

  it("pesan memakai istilah margin untuk syariah dan bunga untuk konvensional", () => {
    const syariah = schema.safeParse({ ...valid, afterRatePercent: -1 });
    expect(syariah.error?.issues[0]?.message).toBe(
      "Margin setelah periode tetap tidak boleh negatif.",
    );
    const konvensional = kprFormSchema("Bunga").safeParse({ ...valid, afterRatePercent: 40 });
    expect(konvensional.error?.issues[0]?.message).toBe(
      "Bunga setelah periode tetap maksimal 30% per tahun.",
    );
  });

  it("menolak uang muka di atas 90% dan harga di bawah batas", () => {
    const result = schema.safeParse({ ...valid, price: 10_000_000, downPayment: 9_500_000 });
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["price", "downPayment"]),
    );
  });
});

describe("produk KPR", () => {
  it("setiap produk punya sumber dan data periode yang konsisten", () => {
    for (const product of KPR_PRODUCTS) {
      expect(product.source.url).toMatch(/^https:\/\//);
      expect(product.tenor.min).toBeLessThanOrEqual(product.tenor.max);
      if (product.segments.length === 0) expect(product.afterRatePercent).not.toBeNull();
    }
  });

  it("bunga atau margin mulai dan periode tetap pertama", () => {
    const bsi = KPR_PRODUCTS.find((product) => product.id === "bsi-sejahtera");
    const mandiri = KPR_PRODUCTS.find((product) => product.id === "mandiri-berjenjang-10");
    expect(bsi && lowestRate(bsi)).toBe(5);
    expect(bsi && firstFixedYears(bsi)).toBeNull();
    expect(mandiri && lowestRate(mandiri)).toBe(4.06);
    expect(mandiri && firstFixedYears(mandiri)).toBe(3);
    expect(productsFor("syariah").every((product) => product.scheme === "syariah")).toBe(true);
  });
});
