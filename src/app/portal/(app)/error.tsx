"use client";

import { ErrorState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export default function PortalError({
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
          <Icon icon={RotateLeft01Icon} aria-hidden="true" />
          Muat ulang
        </Button>
      }
    />
  );
}
