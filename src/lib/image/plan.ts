// Logika kompresi yang tidak bergantung pada browser, supaya bisa diuji unit.

import { DOWNSCALE_FACTOR, MIN_EDGE, QUALITY_STEPS, type ImageProfile } from "@/config/images";

export type OutputType = "image/webp" | "image/jpeg";

export interface Size {
  width: number;
  height: number;
}

/** Ukuran keluaran: sisi terpanjang maksimal `maxEdge`, rasio tetap, tidak pernah diperbesar. */
export function fitWithin(source: Size, maxEdge: number): Size {
  if (source.width <= 0 || source.height <= 0) throw new RangeError("Ukuran gambar tidak valid.");
  const longest = Math.max(source.width, source.height);
  if (longest <= maxEdge) return { width: source.width, height: source.height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

export type Encoder = (size: Size, type: OutputType, quality: number) => Promise<Blob>;

export interface CompressionResult {
  blob: Blob;
  size: Size;
  type: OutputType;
  quality: number;
  attempts: number;
  /** false kalau batas bawah ukuran tercapai tetapi file masih di atas target. */
  metTarget: boolean;
}

/**
 * Mencoba kualitas menurun, lalu mengecilkan dimensi, sampai ukuran file di bawah target.
 * WebP dipakai kalau encoder benar-benar menghasilkan WebP. Kalau tidak, semua percobaan memakai JPEG.
 */
export async function compressWithEncoder(
  source: Size,
  profile: ImageProfile,
  encode: Encoder,
): Promise<CompressionResult> {
  let size = fitWithin(source, profile.maxEdge);
  let type: OutputType = "image/webp";
  let attempts = 0;
  let best: CompressionResult | null = null;

  for (;;) {
    for (const quality of QUALITY_STEPS) {
      let blob = await encode(size, type, quality);
      attempts += 1;
      if (type === "image/webp" && blob.type !== "image/webp") {
        type = "image/jpeg";
        blob = await encode(size, type, quality);
        attempts += 1;
      }
      const result: CompressionResult = { blob, size, type, quality, attempts, metTarget: false };
      if (!best || blob.size < best.blob.size) best = result;
      if (blob.size <= profile.targetBytes) return { ...result, metTarget: true };
    }

    const longest = Math.max(size.width, size.height);
    if (longest <= MIN_EDGE) break;
    size = fitWithin(size, Math.max(MIN_EDGE, Math.floor(longest * DOWNSCALE_FACTOR)));
  }

  if (!best) throw new Error("Kompresi tidak menghasilkan file.");
  return { ...best, attempts };
}

/** Nama file keluaran mengikuti format hasil kompresi. */
export function outputFileName(originalName: string, type: OutputType): string {
  const base = originalName.replace(/\.[^./\\]+$/, "") || "gambar";
  return `${base}.${type === "image/webp" ? "webp" : "jpg"}`;
}
