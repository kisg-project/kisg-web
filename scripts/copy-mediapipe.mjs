#!/usr/bin/env node
// Menyalin file WASM MediaPipe dari node_modules ke public/vendor/mediapipe/wasm sebelum build dan
// dev. Disajikan dari domain sendiri, bukan CDN (keputusan owner, 20 November 2026). Tidak di-commit
// karena ukurannya besar; model wajah (face_landmarker.task) di-commit di public/vendor/mediapipe.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const source = join(process.cwd(), "node_modules", "@mediapipe", "tasks-vision", "wasm");
const target = join(process.cwd(), "public", "vendor", "mediapipe", "wasm");

if (!existsSync(source)) {
  console.error("GAGAL @mediapipe/tasks-vision belum terpasang. Jalankan pnpm install.");
  process.exit(1);
}
mkdirSync(target, { recursive: true });
const files = readdirSync(source).filter((name) => /\.(js|wasm)$/.test(name));
for (const name of files) copyFileSync(join(source, name), join(target, name));
console.log(
  `OK    ${String(files.length)} file WASM MediaPipe disalin ke public/vendor/mediapipe/wasm`,
);
