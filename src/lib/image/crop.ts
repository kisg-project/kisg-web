// Potong foto menjadi persegi di tengah (foto profil). Berjalan di browser, sebelum kompresi.

/**
 * Mengembalikan file JPEG persegi dari bagian tengah foto. Orientasi kamera diterapkan saat decode,
 * dan karena digambar ulang ke canvas, metadata EXIF (termasuk lokasi) ikut terbuang.
 */
export async function cropToSquare(file: File, maxSide = 1024): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const output = Math.min(side, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = output;
    canvas.height = output;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas tidak tersedia.");
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      output,
      output,
    );
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) throw new Error("Foto gagal diproses.");
    return new File([blob], "foto-profil.jpg", { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
