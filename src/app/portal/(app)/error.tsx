"use client";

import Link from "next/link";
import { RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { AppErrorScene } from "@/components/shared/app-error-scene";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";

export default function PortalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <AppErrorScene
      code="500"
      pose="tablet"
      title="Halaman gagal dimuat"
      description="Ada gangguan sebentar. Muat ulang, kalau masih gagal hubungi admin."
      actions={
        <>
          <Button
            size="sm"
            onClick={() => {
              retry();
            }}
          >
            <Icon icon={RotateLeft01Icon} size={18} />
            Muat ulang
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/portal">Ke beranda</Link>
          </Button>
        </>
      }
    />
  );
}
