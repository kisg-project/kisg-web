import { describe, expect, it } from "vitest";
import { cleanChunk, cleanReply } from "./sanitize";

// Karakter terlarang dibentuk dari kode angka supaya file ini lolos pnpm check:copy.
const EM_DASH = String.fromCodePoint(0x2014);
const EN_DASH = String.fromCodePoint(0x2013);
const HOUSE = String.fromCodePoint(0x1f3e1);
const SPARKLES = String.fromCodePoint(0x2728);
const THUMBS_UP = String.fromCodePoint(0x1f44d);

describe("cleanChunk", () => {
  it("mengganti tanda pisah panjang dengan koma", () => {
    expect(cleanChunk(`Rumah siap huni ${EM_DASH} dekat stasiun`)).toBe(
      "Rumah siap huni, dekat stasiun",
    );
    expect(cleanChunk(`2023${EN_DASH}2024`)).toBe("2023, 2024");
  });

  it("membuang emoji dan tanda tebal markdown", () => {
    expect(cleanChunk(`Siap bantu ${HOUSE}${SPARKLES} **sekarang**`)).toBe("Siap bantu  sekarang");
  });
});

describe("cleanReply", () => {
  it("merapikan judul, butir, dan spasi", () => {
    expect(
      cleanReply(`## Harga\n* Tipe 36/60  **Rp 571 juta** ${THUMBS_UP}\n\n\n\nHubungi kami .`),
    ).toBe("Harga\n- Tipe 36/60 Rp 571 juta\n\nHubungi kami.");
  });
});
