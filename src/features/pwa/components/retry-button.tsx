"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button
      onClick={() => {
        window.location.reload();
      }}
    >
      <RotateCcw aria-hidden="true" />
      Muat ulang
    </Button>
  );
}
