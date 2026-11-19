import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="konten" className="flex flex-1 items-center">
      <Container className="py-16">
        <h1 className="sr-only">Halaman tidak ditemukan</h1>
        <EmptyState
          title="Halaman tidak ditemukan."
          description="Alamat halaman mungkin salah atau halaman sudah dipindah. Kembali ke beranda untuk melihat informasi proyek."
          action={
            <Button asChild>
              <Link href="/">Ke beranda</Link>
            </Button>
          }
        />
      </Container>
    </main>
  );
}
