import type { Metadata } from "next";
import Link from "next/link";
import { AppErrorScene } from "@/components/shared/app-error-scene";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

export default function AppNotFound() {
  return (
    <AppErrorScene
      code="404"
      pose="hp"
      title="Halaman tidak ditemukan"
      description="Alamatnya salah atau halamannya sudah tidak ada."
      actions={
        <Button asChild size="sm">
          <Link href="/cms">Ke ringkasan</Link>
        </Button>
      }
    />
  );
}
