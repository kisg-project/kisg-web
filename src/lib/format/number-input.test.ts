import { describe, expect, it } from "vitest";
import {
  caretAfterFormat,
  formatNumberText,
  numberToInputText,
  parseNumberText,
  sanitizeNumberText,
  significantCount,
} from "./number-input";

const MONEY = { decimals: 0 };
const PERCENT = { decimals: 2 };

describe("sanitizeNumberText", () => {
  it("rupiah: hanya digit, titik dan huruf dibuang, nol di depan dihapus", () => {
    expect(sanitizeNumberText("Rp 571.250.000", MONEY)).toBe("571250000");
    expect(sanitizeNumberText("007", MONEY)).toBe("7");
    expect(sanitizeNumberText("1,5", MONEY)).toBe("15");
  });

  it("persen: koma dan titik desimal diterima, maksimal dua digit desimal", () => {
    expect(sanitizeNumberText("7,5", PERCENT)).toBe("7,5");
    expect(sanitizeNumberText("7.5", PERCENT)).toBe("7,5");
    expect(sanitizeNumberText("2,765", PERCENT)).toBe("2,76");
    expect(sanitizeNumberText(",5", PERCENT)).toBe("0,5");
    expect(sanitizeNumberText("7,", PERCENT)).toBe("7,");
  });

  it("titik ribuan pada teks berformat tidak dianggap desimal", () => {
    expect(sanitizeNumberText("1.250,5", PERCENT)).toBe("1250,5");
    expect(sanitizeNumberText("1.250", PERCENT)).toBe("1250");
  });
});

describe("formatNumberText dan parseNumberText", () => {
  it("menambahkan titik ribuan dan mempertahankan koma desimal", () => {
    expect(formatNumberText("571250000")).toBe("571.250.000");
    expect(formatNumberText("1250,5")).toBe("1.250,5");
    expect(formatNumberText("")).toBe("");
  });

  it("membaca teks Indonesia menjadi angka", () => {
    expect(parseNumberText("571.250.000")).toBe(571_250_000);
    expect(parseNumberText("7,5")).toBe(7.5);
    expect(parseNumberText("")).toBeNaN();
  });

  it("angka ke teks input", () => {
    expect(numberToInputText(571_250_000, MONEY)).toBe("571.250.000");
    expect(numberToInputText(7.5, PERCENT)).toBe("7,5");
    expect(numberToInputText(2.76, PERCENT)).toBe("2,76");
    expect(numberToInputText(Number.NaN, MONEY)).toBe("");
  });
});

describe("posisi kursor", () => {
  it("kursor tetap setelah digit yang sama setelah titik ditambahkan", () => {
    // Mengetik "1" di akhir "57125000" menjadi "571250001"
    const raw = "57.125.0001";
    const clean = sanitizeNumberText(raw, MONEY);
    const formatted = formatNumberText(clean);
    expect(formatted).toBe("571.250.001");
    expect(caretAfterFormat(formatted, significantCount(raw, raw.length, MONEY))).toBe(
      formatted.length,
    );
  });

  it("menyisipkan digit di tengah tidak melompatkan kursor ke akhir", () => {
    // "1.000" lalu ketik "5" setelah "1": "15.000" (kursor setelah 5)
    const raw = "15.000";
    const formatted = formatNumberText(sanitizeNumberText(raw, MONEY));
    expect(formatted).toBe("15.000");
    expect(caretAfterFormat(formatted, significantCount(raw, 2, MONEY))).toBe(2);
  });

  it("kursor di awal tetap di awal", () => {
    expect(caretAfterFormat("1.000", 0)).toBe(0);
  });
});
