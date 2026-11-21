import { describe, expect, it } from "vitest";
import { FRIENDLY_FALLBACK, friendlyMessage } from "./friendly-message";

describe("friendlyMessage", () => {
  it("meneruskan pesan biasa berbahasa Indonesia", () => {
    for (const text of [
      "Titik absensi ditambahkan.",
      "Lokasi diambil (akurasi 120 m).",
      "Pengajuan disetujui.",
    ]) {
      expect(friendlyMessage(text)).toBe(text);
    }
  });

  it("mengganti pesan teknis dengan kalimat ramah", () => {
    for (const text of [
      "TypeError: Failed to fetch",
      "duplicate key value violates unique constraint",
      "PGRST116: JSON object requested",
      "Internal Server Error",
      "NEXT_REDIRECT",
      '{"code":"42501"}',
      "at foo (bar.js:1:2)",
    ]) {
      expect(friendlyMessage(text), text).toBe(FRIENDLY_FALLBACK);
    }
  });

  it("pesan kosong memakai pengganti", () => {
    expect(friendlyMessage("  ")).toBe(FRIENDLY_FALLBACK);
    expect(friendlyMessage(undefined, "Coba lagi.")).toBe("Coba lagi.");
  });
});
