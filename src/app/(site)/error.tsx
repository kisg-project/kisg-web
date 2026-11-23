"use client";

import { SiteErrorScene } from "@/components/shared/site-error-scene";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/config/site";
import { RotateLeft01Icon } from "@hugeicons/core-free-icons";

export default function SiteError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <SiteErrorScene
      code="500"
      title="Halaman gagal dimuat"
      description="Ada gangguan sebentar di sisi kami. Muat ulang halaman, atau hubungi marketing lewat WhatsApp."
      actions={
        <>
          <Button
            onClick={() => {
              retry();
            }}
          >
            <Icon icon={RotateLeft01Icon} />
            Muat ulang
          </Button>
          <Button asChild variant="outline">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              Hubungi marketing
            </a>
          </Button>
        </>
      }
    />
  );
}
