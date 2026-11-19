import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures/test";

// Kompresi gambar di browser (CLAUDE.md bagian 8). Diuji di /dev/ui dengan modul yang sama dengan form unggah.

async function compressedResult(page: Page) {
  const result = page.getByTestId("hasil-kompresi");
  await expect(result).toBeVisible({ timeout: 40_000 });
  const read = async (name: string) => (await result.getAttribute(name)) ?? "";
  return {
    bytes: Number(await read("data-bytes")),
    originalBytes: Number(await read("data-original-bytes")),
    type: await read("data-type"),
    width: Number(await read("data-width")),
    height: Number(await read("data-height")),
    metTarget: await read("data-met-target"),
    containsMetadata: (await read("data-has-metadata")) === "true",
  };
}

test("foto kamera besar diperkecil di bawah target profil konten", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/dev/ui");

  // Membuat foto JPEG besar (4000 x 3000, gradasi dengan noise seperti foto kamera) di browser.
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 4000;
    canvas.height = 3000;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2D tidak tersedia");
    const gradient = context.createLinearGradient(0, 0, 4000, 3000);
    gradient.addColorStop(0, "#88b4aa");
    gradient.addColorStop(1, "#d7ae5f");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 4000, 3000);
    const image = context.getImageData(0, 0, 4000, 3000);
    for (let index = 0; index < image.data.length; index += 4) {
      const noise = (Math.random() - 0.5) * 16;
      image.data[index] = (image.data[index] ?? 0) + noise;
      image.data[index + 1] = (image.data[index + 1] ?? 0) + noise;
      image.data[index + 2] = (image.data[index + 2] ?? 0) + noise;
    }
    context.putImageData(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (value) resolve(value);
          else reject(new Error("toBlob gagal"));
        },
        "image/jpeg",
        0.95,
      );
    });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 32_768) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
    }
    return btoa(binary);
  });

  await page.getByLabel("Profil kompresi").selectOption("content");
  await page.getByLabel("Pilih foto").setInputFiles({
    name: "kamera.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(base64, "base64"),
  });

  const result = await compressedResult(page);
  expect(result.originalBytes).toBeGreaterThan(2 * 1024 * 1024);
  expect(result.bytes).toBeLessThanOrEqual(500 * 1024);
  expect(result.metTarget).toBe("true");
  expect(["image/webp", "image/jpeg"]).toContain(result.type);
  expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(2048);
});

test("orientasi kamera diterapkan dan EXIF termasuk GPS dibuang", async ({ page }) => {
  await page.goto("/dev/ui");
  await page.getByLabel("Profil kompresi").selectOption("siteReport");
  // Fixture 1200 x 800 dengan EXIF orientasi 6 (tampil tegak) dan koordinat GPS.
  const fixture = await readFile(join(process.cwd(), "e2e/fixtures/files/exif-gps-rotated.jpg"));
  await page.getByLabel("Pilih foto").setInputFiles({
    name: "laporan.jpg",
    mimeType: "image/jpeg",
    buffer: fixture,
  });

  const result = await compressedResult(page);
  expect(result.width).toBe(800);
  expect(result.height).toBe(1200);
  expect(result.containsMetadata).toBe(false);
});

test("file bukan gambar ditolak dengan pesan yang jelas", async ({ page }) => {
  await page.goto("/dev/ui");
  await page.getByLabel("Pilih foto").setInputFiles({
    name: "dokumen.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bukan gambar"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Format file tidak didukung" }),
  ).toBeVisible();
});
