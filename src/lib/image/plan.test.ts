import { describe, expect, it, vi } from "vitest";
import { MIN_EDGE, QUALITY_STEPS } from "@/config/images";
import { compressWithEncoder, fitWithin, outputFileName, type Encoder } from "./plan";

const blobOf = (bytes: number, type: string) => new Blob([new Uint8Array(bytes)], { type });

describe("fitWithin", () => {
  it("mengecilkan sisi terpanjang ke batas dan menjaga rasio", () => {
    expect(fitWithin({ width: 4000, height: 3000 }, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin({ width: 3000, height: 4000 }, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("tidak memperbesar gambar kecil", () => {
    expect(fitWithin({ width: 800, height: 600 }, 2048)).toEqual({ width: 800, height: 600 });
  });

  it("menolak ukuran nol", () => {
    expect(() => fitWithin({ width: 0, height: 10 }, 100)).toThrow(RangeError);
  });
});

describe("compressWithEncoder", () => {
  const profile = { maxEdge: 1600, targetBytes: 300 * 1024 };

  it("berhenti di kualitas pertama yang di bawah target", async () => {
    const encode = vi.fn<Encoder>((_size, type, quality) =>
      Promise.resolve(blobOf(quality > 0.7 ? 400 * 1024 : 250 * 1024, type)),
    );
    const result = await compressWithEncoder({ width: 4000, height: 3000 }, profile, encode);
    expect(result).toMatchObject({
      type: "image/webp",
      quality: QUALITY_STEPS[2],
      metTarget: true,
      size: { width: 1600, height: 1200 },
    });
    expect(encode).toHaveBeenCalledTimes(3);
  });

  it("beralih ke JPEG kalau browser tidak bisa membuat WebP", async () => {
    const encode: Encoder = (_size, type) =>
      Promise.resolve(
        type === "image/webp" ? blobOf(100, "image/png") : blobOf(100 * 1024, "image/jpeg"),
      );
    const result = await compressWithEncoder({ width: 2000, height: 1000 }, profile, encode);
    expect(result.type).toBe("image/jpeg");
    expect(result.blob.type).toBe("image/jpeg");
    expect(result.metTarget).toBe(true);
  });

  it("mengecilkan dimensi kalau kualitas terendah masih terlalu besar", async () => {
    const encode: Encoder = (size, type) =>
      Promise.resolve(blobOf(size.width >= 1600 ? 500 * 1024 : 200 * 1024, type));
    const result = await compressWithEncoder({ width: 4000, height: 3000 }, profile, encode);
    expect(result.metTarget).toBe(true);
    expect(result.size.width).toBe(1280);
  });

  it("mengembalikan hasil terkecil dan metTarget false kalau batas bawah tercapai", async () => {
    const encode: Encoder = (size, type) => Promise.resolve(blobOf(size.width * 1000, type));
    const result = await compressWithEncoder({ width: 4000, height: 3000 }, profile, encode);
    expect(result.metTarget).toBe(false);
    expect(Math.max(result.size.width, result.size.height)).toBe(MIN_EDGE);
  });
});

describe("outputFileName", () => {
  it("mengganti ekstensi sesuai format", () => {
    expect(outputFileName("IMG_2026.HEIC", "image/webp")).toBe("IMG_2026.webp");
    expect(outputFileName("foto.lapangan.jpg", "image/jpeg")).toBe("foto.lapangan.jpg");
    expect(outputFileName(".jpg", "image/webp")).toBe("gambar.webp");
  });
});
