"use client";

import { Button } from "@/components/ui/button";
import { RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export function RetryButton() {
  return (
    <Button
      onClick={() => {
        window.location.reload();
      }}
    >
      <Icon icon={RotateLeft01Icon} aria-hidden="true" />
      Muat ulang
    </Button>
  );
}
