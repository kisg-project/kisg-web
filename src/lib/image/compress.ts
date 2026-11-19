// API kompresi gambar di browser (CLAUDE.md bagian 8). Dipakai semua form unggah.

import { ACCEPTED_IMAGE_TYPES, IMAGE_PROFILES, type ImageProfileName } from "@/config/images";
import { createBitmapEncoder } from "./encode";
import {
  compressWithEncoder,
  outputFileName,
  type CompressionResult,
  type OutputType,
} from "./plan";
import type { WorkerRequest, WorkerResponse } from "./compress.worker";

export interface CompressedImage {
  file: File;
  width: number;
  height: number;
  type: OutputType;
  originalBytes: number;
  bytes: number;
  /** false kalau file masih di atas target setelah dikecilkan sampai batas bawah. */
  metTarget: boolean;
}

export type ImageCompressionErrorCode = "unsupported_type" | "decode_failed" | "encode_failed";

export class ImageCompressionError extends Error {
  constructor(
    readonly code: ImageCompressionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ImageCompressionError";
  }
}

const MESSAGES: Record<ImageCompressionErrorCode, string> = {
  unsupported_type: "Format file tidak didukung. Pilih foto JPG, PNG, WebP, atau HEIC.",
  decode_failed:
    "Foto tidak bisa dibuka di browser ini. Coba ambil ulang foto atau pilih format JPG.",
  encode_failed: "Foto gagal diperkecil. Coba lagi atau pilih foto lain.",
};

function isAcceptedType(file: File): boolean {
  // Sebagian browser memberi type kosong untuk HEIC. Biarkan decoder yang memutuskan.
  return file.type === "" || (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageCompressionError("decode_failed", MESSAGES.decode_failed);
  }
}

let worker: Worker | null = null;
let workerBroken = false;
const pending = new Map<string, (response: WorkerResponse) => void>();

function canUseWorker(): boolean {
  return !workerBroken && typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./compress.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const resolve = pending.get(event.data.id);
    if (resolve) {
      pending.delete(event.data.id);
      resolve(event.data);
    }
  };
  worker.onerror = () => {
    workerBroken = true;
    for (const [id, resolve] of pending) resolve({ id, ok: false, message: "worker_error" });
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function compressInWorker(bitmap: ImageBitmap, profile: ImageProfileName): Promise<WorkerResponse> {
  const id = crypto.randomUUID();
  const request: WorkerRequest = { id, bitmap, profile };
  return new Promise((resolve) => {
    pending.set(id, resolve);
    getWorker().postMessage(request, [bitmap]);
  });
}

async function compressOnMainThread(
  file: File,
  profile: ImageProfileName,
): Promise<CompressionResult> {
  const bitmap = await decode(file);
  try {
    return await compressWithEncoder(
      { width: bitmap.width, height: bitmap.height },
      IMAGE_PROFILES[profile],
      createBitmapEncoder(bitmap),
    );
  } finally {
    bitmap.close();
  }
}

/**
 * Mengompres foto sebelum diunggah: orientasi kamera diterapkan, EXIF dibuang,
 * hasil WebP (atau JPEG kalau WebP tidak didukung) di bawah target ukuran profil.
 */
export async function compressImage(
  file: File,
  profile: ImageProfileName,
): Promise<CompressedImage> {
  if (!isAcceptedType(file)) {
    throw new ImageCompressionError("unsupported_type", MESSAGES.unsupported_type);
  }

  let result: CompressionResult | null = null;

  if (canUseWorker()) {
    const response = await compressInWorker(await decode(file), profile);
    if (response.ok) result = response.result;
    else workerBroken = true;
  }

  if (!result) {
    try {
      result = await compressOnMainThread(file, profile);
    } catch (error) {
      if (error instanceof ImageCompressionError) throw error;
      throw new ImageCompressionError("encode_failed", MESSAGES.encode_failed);
    }
  }

  const output = new File([result.blob], outputFileName(file.name, result.type), {
    type: result.type,
    lastModified: Date.now(),
  });

  return {
    file: output,
    width: result.size.width,
    height: result.size.height,
    type: result.type,
    originalBytes: file.size,
    bytes: output.size,
    metTarget: result.metTarget,
  };
}
