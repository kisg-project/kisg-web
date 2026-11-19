import { expect, it } from "vitest";
import { formatRupiah } from "./currency";

// PR percobaan (Fase 1, CLAUDE.md bagian 10): test ini sengaja salah untuk membuktikan CI memblokir merge.
it("sengaja gagal untuk menguji pengaman CI", () => {
  expect(formatRupiah(1000)).toBe("Rp 2.000");
});
