import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { SecurityBlockIcon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = { title: "Akses ditolak" };

export default function AccessDeniedPage() {
  return (
    <>
      <h1 className="sr-only">Akses ditolak</h1>
      <EmptyState
        icon={SecurityBlockIcon}
        title="Anda tidak punya akses ke halaman ini."
        description="Halaman ini khusus role tertentu. Kalau Anda butuh akses, hubungi admin."
        action={
          <Button asChild>
            <Link href="/portal">Ke beranda portal</Link>
          </Button>
        }
      />
    </>
  );
}
