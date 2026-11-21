import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, slugify } from "./slug";

describe("slugify", () => {
  it.each([
    [
      "BI-Rate naik ke 6 persen: cara menjaga cicilan",
      "bi-rate-naik-ke-6-persen-cara-menjaga-cicilan",
    ],
    ["  Rumah   Tipe 36/60  ", "rumah-tipe-36-60"],
    ["Café & Résidence", "cafe-residence"],
    ["!!!", ""],
  ])("%s", (title, expected) => {
    expect(slugify(title)).toBe(expected);
  });

  it("dipotong tanpa tanda hubung di akhir dan selalu lolos pola database", () => {
    const slug = slugify("kata ".repeat(40), 30);
    expect(slug.length).toBeLessThanOrEqual(30);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});
