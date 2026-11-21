import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/** Ukuran gambar share (Open Graph dan Twitter) yang dipakai semua platform. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

// Aset dibaca sekali per instance server. Font statis karena pembuat gambar tidak membaca font variabel.
const asset = (name: string) => readFile(join(process.cwd(), "src/assets/og", name));
const assets = Promise.all([
  asset("plus-jakarta-sans-500.woff"),
  asset("plus-jakarta-sans-700.woff"),
  asset("plus-jakarta-sans-800.woff"),
  asset("logo-light.png"),
  asset("cover.jpg"),
]);

const COLORS = {
  ink: "#013c34",
  mist: "#c5e0d9",
  gold: "#d7ae5f",
  white: "#ffffff",
} as const;

function dataUri(bytes: Buffer, type: string): string {
  return `data:${type};base64,${bytes.toString("base64")}`;
}

/** Potong judul panjang di batas kata supaya tetap muat tiga baris. */
export function clampTitle(title: string, max = 64): string {
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 12)).trimEnd()}...`;
}

/**
 * Gambar share bermerek KIS: panel hijau tua dengan logo, judul halaman, dan keterangan singkat, lalu
 * foto proyek berbingkai garis atap logo di sisi kanan.
 */
export async function renderOgImage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}): Promise<ImageResponse> {
  const [regular, bold, extraBold, logo, cover] = await assets;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: COLORS.ink,
        fontFamily: "Jakarta",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 660,
          padding: "60px 56px 56px 64px",
          color: COLORS.white,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- elemen gambar ImageResponse, bukan halaman */}
        <img src={dataUri(logo, "image/png")} width={140} height={80} alt="" />
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: -1.5,
          }}
        >
          {clampTitle(title)}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.35,
            color: COLORS.mist,
          }}
        >
          {clampTitle(subtitle, 110)}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.gold,
          }}
        >
          {siteConfig.domain}
        </div>
      </div>
      <div style={{ display: "flex", position: "relative", width: 540, height: 630 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- elemen gambar ImageResponse, bukan halaman */}
        <img
          src={dataUri(cover, "image/jpeg")}
          width={540}
          height={630}
          alt=""
          style={{ objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(90deg, #013c34 0%, rgba(1,60,52,0) 38%)",
          }}
        />
        <svg
          width="540"
          height="630"
          viewBox="0 0 540 630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <polyline
            points="-10,250 250,70 560,190"
            fill="none"
            stroke={COLORS.gold}
            strokeWidth="12"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Jakarta", data: regular, weight: 500, style: "normal" },
        { name: "Jakarta", data: bold, weight: 700, style: "normal" },
        { name: "Jakarta", data: extraBold, weight: 800, style: "normal" },
      ],
      headers: {
        // Halaman jarang berubah. CDN menyimpan sehari, lalu menyajikan versi lama sambil memperbarui.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
