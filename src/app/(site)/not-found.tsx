import type { Metadata } from "next";
import Link from "next/link";
import { SiteErrorScene } from "@/components/shared/site-error-scene";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/config/site";

export const metadata: Metadata = { title: "Halaman tidak ditemukan", robots: { index: false } };

export default function SiteNotFound() {
  return (
    <SiteErrorScene
      code="404"
      title="Halaman tidak ditemukan"
      description="Alamatnya salah atau halamannya sudah dipindah. Lihat proyek yang masih tersedia atau hubungi marketing."
      actions={
        <>
          <Button asChild>
            <Link href="/">Kembali ke beranda</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              Hubungi marketing
            </a>
          </Button>
        </>
      }
    />
  );
}
