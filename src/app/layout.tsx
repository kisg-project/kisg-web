import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteConfig } from "@/config/site";
import { env } from "@/env";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${siteConfig.featuredProject.name}, ${siteConfig.featuredProject.area} | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: `${siteConfig.featuredProject.name} di ${siteConfig.featuredProject.area}, Kabupaten Bekasi. Dikembangkan oleh ${siteConfig.legalName}.`,
  applicationName: siteConfig.name,
  // Ikon tab dari file src/app/favicon.ico, icon.png, dan apple-icon.png (dibuat dari logo KIS).
  // Gambar share bawaan untuk halaman yang tidak mengatur sendiri.
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: siteConfig.name,
    images: [{ url: "/og?p=%2F", width: 1200, height: 630, alt: siteConfig.featuredProject.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og?p=%2F"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F6D5F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plusJakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
