// Web Worker kompresi gambar: menjalankan encode di luar main thread supaya layar tidak macet.

import { IMAGE_PROFILES, type ImageProfileName } from "@/config/images";
import { createBitmapEncoder } from "./encode";
import { compressWithEncoder, type CompressionResult } from "./plan";

export interface WorkerRequest {
  id: string;
  bitmap: ImageBitmap;
  profile: ImageProfileName;
}

export type WorkerResponse =
  { id: string; ok: true; result: CompressionResult } | { id: string; ok: false; message: string };

// Tipe minimal scope worker. Lib "webworker" tidak dipakai karena bentrok dengan lib "dom".
interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event) => {
  const { id, bitmap, profile } = event.data;
  compressWithEncoder(
    { width: bitmap.width, height: bitmap.height },
    IMAGE_PROFILES[profile],
    createBitmapEncoder(bitmap),
  )
    .then((result) => {
      scope.postMessage({ id, ok: true, result });
    })
    .catch((error: unknown) => {
      scope.postMessage({
        id,
        ok: false,
        message: error instanceof Error ? error.message : "Kompresi gagal.",
      });
    })
    .finally(() => {
      bitmap.close();
    });
};
