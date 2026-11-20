"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMAGE_PROFILES, type ImageProfileName } from "@/config/images";
import { compressImage, ImageCompressionError, type CompressedImage } from "@/lib/image";

const PROFILE_LABELS: Record<ImageProfileName, string> = {
  content: "Konten website",
  siteReport: "Laporan lapangan",
  attendance: "Selfie absensi",
  document: "Dokumen konsumen",
};

/** Alat uji kompresi untuk review manual dan E2E (e2e/site/image-compress.spec.ts). */
export function ImageCompressTester() {
  const [profile, setProfile] = useState<ImageProfileName>("content");
  const [result, setResult] = useState<CompressedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasMetadata, setHasMetadata] = useState<boolean | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const compressed = await compressImage(file, profile);
      // Cek penanda EXIF dan GPS di awal file hasil, tanpa fetch (CSP connect-src tidak mengizinkan blob:).
      const head = new Uint8Array(await compressed.file.slice(0, 65_536).arrayBuffer());
      const text = new TextDecoder("latin1").decode(head);
      setHasMetadata(text.includes("Exif") || text.includes("GPS"));
      setResult(compressed);
    } catch (caught) {
      setError(caught instanceof ImageCompressionError ? caught.message : "Kompresi gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:max-w-xl">
      <div className="grid grid-cols-1 gap-1.5">
        <Label htmlFor="profil-kompresi">Profil kompresi</Label>
        <Select
          value={profile}
          onValueChange={(value) => {
            setProfile(value as ImageProfileName);
          }}
        >
          <SelectTrigger id="profil-kompresi" className="h-11 w-full min-w-0 rounded-md px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {(Object.keys(IMAGE_PROFILES) as ImageProfileName[]).map((name) => (
              <SelectItem key={name} value={name} className="min-h-10">
                {PROFILE_LABELS[name]} (maks {IMAGE_PROFILES[name].maxEdge} px,{" "}
                {IMAGE_PROFILES[name].targetBytes / 1024} KB)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        <Label htmlFor="file-kompresi">Pilih foto</Label>
        <input
          id="file-kompresi"
          type="file"
          accept="image/*"
          className="min-h-11 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {busy ? "Mengompres foto." : result ? "Kompresi selesai." : "Belum ada foto."}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {result && hasMetadata !== null ? (
        <dl
          data-testid="hasil-kompresi"
          data-bytes={result.bytes}
          data-original-bytes={result.originalBytes}
          data-type={result.type}
          data-width={result.width}
          data-height={result.height}
          data-met-target={String(result.metTarget)}
          data-has-metadata={String(hasMetadata)}
          className="grid grid-cols-2 gap-2 rounded-md border p-4 text-sm tabular"
        >
          <dt>Ukuran asli</dt>
          <dd>{Math.round(result.originalBytes / 1024)} KB</dd>
          <dt>Ukuran hasil</dt>
          <dd>{Math.round(result.bytes / 1024)} KB</dd>
          <dt>Format</dt>
          <dd>{result.type}</dd>
          <dt>Dimensi</dt>
          <dd>
            {result.width} x {result.height} px
          </dd>
        </dl>
      ) : null}
    </div>
  );
}
