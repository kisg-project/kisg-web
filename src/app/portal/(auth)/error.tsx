"use client";

import { RotateCcw } from "lucide-react";
import { ErrorState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";

export default function PortalAuthError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="Halaman gagal dimuat."
      description="Coba muat ulang. Kalau masih gagal, hubungi admin."
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
