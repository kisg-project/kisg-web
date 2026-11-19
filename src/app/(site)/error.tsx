"use client";

import { Phone, RotateCcw } from "lucide-react";
import { Container } from "@/components/shared/container";
import { ErrorState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/config/site";

export default function SiteError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Container className="py-16">
      <ErrorState
        title="Halaman gagal dimuat."
        description="Coba muat ulang. Kalau masih gagal, hubungi marketing lewat WhatsApp."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                retry();
              }}
            >
              <RotateCcw aria-hidden="true" />
              Muat ulang
            </Button>
            <Button asChild variant="outline">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <Phone aria-hidden="true" />
                Hubungi marketing
              </a>
            </Button>
          </div>
        }
      />
    </Container>
  );
}
