import { describe, expect, it } from "vitest";
import { parseHomeStats } from "./stats";

describe("parseHomeStats", () => {
  it("membaca angka, label, satuan m2, dan countUp bawaan", () => {
    expect(
      parseHomeStats([
        { value: 2022, label: "Tahun berdiri", countUp: false },
        { value: 36, suffix: " m2", label: "Luas bangunan" },
      ]),
    ).toEqual([
      { value: 2022, label: "Tahun berdiri", countUp: false },
      { value: 36, suffix: " m²", label: "Luas bangunan", countUp: true },
    ]);
  });

  it("item rusak dilewati dan nilai bukan daftar menghasilkan kosong", () => {
    expect(parseHomeStats([{ value: -1, label: "x" }, { label: "tanpa angka" }, "teks"])).toEqual(
      [],
    );
    expect(parseHomeStats({ value: 1 })).toEqual([]);
  });
});
