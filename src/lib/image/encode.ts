// Encoder berbasis canvas. Dipakai di Web Worker (OffscreenCanvas) dan di main thread (fallback).
// Menggambar ulang ke canvas otomatis membuang metadata EXIF, termasuk lokasi GPS.

import type { Encoder, OutputType, Size } from "./plan";

type DrawableCanvas = OffscreenCanvas | HTMLCanvasElement;

function canvasToBlob(canvas: DrawableCanvas, type: OutputType, quality: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Browser gagal membuat file gambar."));
      },
      type,
      quality,
    );
  });
}

function createCanvas(size: Size): DrawableCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size.width, size.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas;
}

/** Bagian konteks 2D yang dipakai, sama untuk OffscreenCanvas dan canvas biasa. */
type Context2D = Pick<
  CanvasRenderingContext2D,
  "fillStyle" | "fillRect" | "drawImage" | "imageSmoothingEnabled" | "imageSmoothingQuality"
>;

function context2d(canvas: DrawableCanvas): Context2D | null {
  if ("convertToBlob" in canvas) return canvas.getContext("2d");
  return canvas.getContext("2d");
}

/** Encoder yang menggambar `bitmap` ke ukuran yang diminta. Canvas dipakai ulang selama ukurannya sama. */
export function createBitmapEncoder(bitmap: ImageBitmap): Encoder {
  let canvas: DrawableCanvas | null = null;
  let current: Size | null = null;

  return async (size, type, quality) => {
    if (!canvas || !current || current.width !== size.width || current.height !== size.height) {
      canvas = createCanvas(size);
      current = size;
      const context = context2d(canvas);
      if (!context) throw new Error("Browser tidak mendukung canvas 2D.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      // Latar putih supaya PNG transparan tidak menjadi hitam saat disimpan sebagai JPEG.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(bitmap, 0, 0, size.width, size.height);
    }
    return canvasToBlob(canvas, type, quality);
  };
}
