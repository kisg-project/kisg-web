// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { clampTitle, renderOgImage } = await import("./og-image");

describe("clampTitle", () => {
  it("judul pendek tidak diubah dan spasi berlebih dirapikan", () => {
    expect(clampTitle("  Simulasi   KPR ")).toBe("Simulasi KPR");
  });

  it("judul panjang dipotong di batas kata dengan elipsis", () => {
    const result = clampTitle(
      "BI-Rate naik ke 6 persen: cara menjaga cicilan KPR tetap terkendali sampai akhir tenor",
    );
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(67);
    expect(result).not.toMatch(/\s\.\.\.$/);
  });
});

describe("renderOgImage", () => {
  it("menghasilkan PNG 1200x630 yang boleh disimpan CDN", async () => {
    const response = await renderOgImage({ title: "Simulasi KPR", subtitle: "Hitung angsuran." });
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
    const bytes = new Uint8Array(await response.arrayBuffer());
    // Tanda tangan PNG, lalu lebar dan tinggi dari chunk IHDR.
    expect([...bytes.slice(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  }, 60_000);
});
