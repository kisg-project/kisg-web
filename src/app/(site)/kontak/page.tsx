import type { Metadata } from "next";
import { MapPin, MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";
import { LeadForm } from "@/features/leads";

export const metadata: Metadata = {
  title: "Kontak",
  description: `Hubungi marketing KIS Group lewat WhatsApp ${siteConfig.whatsapp.display} atau datang ke kantor pemasaran di Bekasi Utara.`,
  alternates: { canonical: "/kontak" },
};

const officeMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${siteConfig.legalName}, ${formatOfficeAddress()}`,
)}`;

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Kontak"
        description="Tanya unit, harga, simulasi KPR, atau jadwal survei. Marketing kami membalas lewat WhatsApp."
        crumbs={[{ name: "Kontak", path: "/kontak" }]}
      />
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal className="flex lift flex-col gap-4 rounded-lg border bg-card p-6 lg:col-span-2">
            <span className="flex size-12 items-center justify-center rounded-md bg-primary-50 text-primary-700">
              <MessageCircle aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold">WhatsApp marketing</h2>
              <p className="mt-1 text-lg font-semibold tabular">{siteConfig.whatsapp.display}</p>
            </div>
            <div>
              <Button asChild size="lg">
                <a
                  href={whatsappLink("Halo, saya ingin bertanya tentang rumah KIS Group.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat lewat WhatsApp
                </a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={80} className="flex lift flex-col gap-4 rounded-lg border bg-card p-6">
            <span className="flex size-12 items-center justify-center rounded-md bg-primary-50 text-primary-700">
              <InstagramIcon aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Instagram</h2>
              <p className="mt-1 font-semibold">{siteConfig.instagram.handle}</p>
            </div>
            <div>
              <Button asChild variant="outline">
                <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer">
                  Buka Instagram
                </a>
              </Button>
            </div>
          </Reveal>

          <Reveal
            delay={160}
            className="flex lift flex-col gap-4 rounded-lg border bg-card p-6 lg:col-span-3 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
              <address className="not-italic">
                <h2 className="text-xl font-bold">Kantor pemasaran</h2>
                <p className="mt-1 max-w-xl">{formatOfficeAddress()}</p>
              </address>
            </div>
            <div>
              <Button asChild variant="outline">
                <a href={officeMaps} target="_blank" rel="noopener noreferrer">
                  Buka di Google Maps
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section
        id="kirim-pesan"
        tone="surface"
        title="Kirim pesan"
        description="Tinggalkan nama dan nomor WhatsApp. Marketing kami membalas di jam kerja."
      >
        <Reveal className="max-w-3xl rounded-lg border bg-card p-5 shadow-xs sm:p-6">
          <LeadForm formKind="kontak" idPrefix="kontak" />
        </Reveal>
      </Section>
    </>
  );
}
