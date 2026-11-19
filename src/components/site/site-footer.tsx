import { MapPin, Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="bg-footer pb-safe text-footer-foreground">
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          {/* Bidang terang supaya atap hijau logo tetap kontras di latar footer yang gelap. */}
          <div className="inline-flex rounded-md bg-white px-4 py-3">
            <Logo imageClassName="h-14 w-auto min-w-24" />
          </div>
          <p className="mt-3 text-sm">{siteConfig.legalName}</p>
        </div>
        <address className="not-italic">
          <p className="text-sm font-semibold text-gold-400">Kantor pemasaran</p>
          <p className="mt-2 flex gap-2 text-sm">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{formatOfficeAddress()}</span>
          </p>
        </address>
        <div>
          <p className="text-sm font-semibold text-gold-400">Kontak</p>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
              >
                <Phone aria-hidden="true" className="size-4" />
                WhatsApp {siteConfig.whatsapp.display}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                Instagram {siteConfig.instagram.handle}
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-primary-800">
        <Container className="py-4 text-xs">&copy; {siteConfig.legalName}</Container>
      </div>
    </footer>
  );
}
