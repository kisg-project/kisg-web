import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false },
};

// 404 di dalam layout website (header dan footer tetap tampil), misal slug proyek atau berita salah.
export default function SiteNotFound() {
  return (
    <Container className="py-16">
      <h1 className="sr-only">Halaman tidak ditemukan</h1>
      <EmptyState
        title="Halaman tidak ditemukan."
        description="Alamat halaman mungkin salah atau kontennya sudah tidak tersedia."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/">Ke beranda</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/proyek">Lihat proyek</Link>
            </Button>
          </div>
        }
      />
    </Container>
  );
}
