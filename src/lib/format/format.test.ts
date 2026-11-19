import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import {
  formatDateTimeWIB,
  formatDateWIB,
  formatPhoneDisplay,
  formatRupiah,
  formatTimeWIB,
  isIndonesianMobile,
  normalizePhoneID,
  parseRupiah,
  toJakartaDateString,
  toWhatsAppNumber,
} from "./index";

describe("formatRupiah", () => {
  it("memformat bigint dan number tanpa desimal", () => {
    expect(formatRupiah(1_250_000_000n)).toBe("Rp 1.250.000.000");
    expect(formatRupiah(350_000)).toBe("Rp 350.000");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("menolak nilai tak berhingga", () => {
    expect(() => formatRupiah(Number.NaN)).toThrow(RangeError);
  });
});

describe("parseRupiah", () => {
  it("membaca teks rupiah menjadi bigint", () => {
    expect(parseRupiah("Rp 1.250.000")).toBe(1_250_000n);
    expect(parseRupiah("350000")).toBe(350_000n);
  });

  it("mengembalikan null untuk masukan kosong atau terlalu panjang", () => {
    expect(parseRupiah("Rp")).toBeNull();
    expect(parseRupiah("9".repeat(16))).toBeNull();
  });
});

describe("tanggal WIB", () => {
  // 19 Nov 2026 17.30 UTC = 20 Nov 2026 00.30 WIB
  const lateUtc = new Date("2026-11-19T17:30:00Z");

  it("menampilkan tanggal di zona Jakarta, bukan UTC", () => {
    expect(formatDateWIB(lateUtc)).toBe("20 November 2026");
    expect(toJakartaDateString(lateUtc)).toBe("2026-11-20");
  });

  it("menampilkan jam dengan titik dan label WIB", () => {
    expect(formatTimeWIB("2026-11-19T07:05:00Z")).toBe("14.05 WIB");
    expect(formatDateTimeWIB("2026-11-19T07:05:00Z")).toBe("19 November 2026, 14.05 WIB");
  });

  it("menolak tanggal tidak valid", () => {
    expect(() => formatDateWIB("bukan tanggal")).toThrow(RangeError);
  });
});

describe("normalizePhoneID", () => {
  it.each([
    ["0896-7329-6881", "+6289673296881"],
    ["089673296881", "+6289673296881"],
    ["6289673296881", "+6289673296881"],
    ["+62 896-7329-6881", "+6289673296881"],
    ["(+62) 896 7329 6881", null],
    ["89673296881", "+6289673296881"],
    ["021 8888 1234", "+622188881234"],
  ])("%s menjadi %s", (input, expected) => {
    expect(normalizePhoneID(input)).toBe(expected);
  });

  it.each(["", "abc", "+1 415 555 0100", "0800", "08967329688112345", "0 0896 7329"])(
    "menolak %s",
    (input) => {
      expect(normalizePhoneID(input)).toBeNull();
    },
  );
});

describe("isIndonesianMobile", () => {
  it("membedakan seluler dan telepon rumah", () => {
    expect(isIndonesianMobile("+6289673296881")).toBe(true);
    expect(isIndonesianMobile("+622188881234")).toBe(false);
  });
});

describe("formatPhoneDisplay dan toWhatsAppNumber", () => {
  it("cocok dengan data WhatsApp di siteConfig", () => {
    expect(formatPhoneDisplay(siteConfig.whatsapp.e164)).toBe(siteConfig.whatsapp.display);
    expect(`https://wa.me/${toWhatsAppNumber(siteConfig.whatsapp.e164)}`).toBe(
      siteConfig.whatsapp.url,
    );
  });

  it("membiarkan nomor non Indonesia apa adanya", () => {
    expect(formatPhoneDisplay("+14155550100")).toBe("+14155550100");
  });
});
