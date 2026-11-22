"use client";

import { Container } from "@/components/shared/container";
import { ErrorState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/config/site";
import { Call02Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

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
              <Icon icon={RotateLeft01Icon} aria-hidden="true" />
              Muat ulang
            </Button>
            <Button asChild variant="outline">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <Icon icon={Call02Icon} aria-hidden="true" />
                Hubungi marketing
              </a>
            </Button>
          </div>
        }
      />
    </Container>
  );
}
