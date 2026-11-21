"use client";

import { RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";

export default function PortalSetupError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="Halaman gagal dimuat."
      description="Coba muat ulang. Kalau masih gagal, hubungi owner."
      action={
        <Button
          onClick={() => {
            retry();
          }}
        >
          <RotateCcw aria-hidden="true" />
          Muat ulang
        </Button>
      }
    />
  );
}
