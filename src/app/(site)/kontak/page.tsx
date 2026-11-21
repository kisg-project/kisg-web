import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { formatOfficeAddress, officeMapsUrl, siteConfig, whatsappLink } from "@/config/site";
import { LeadForm } from "@/features/leads";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/kontak",
  title: "Kontak",
  description: `Hubungi KIS Group lewat WhatsApp ${siteConfig.whatsapp.display}, email hallo@kisgroup.co.id, atau datang ke kantor pemasaran di Bekasi Utara.`,
});

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
          <Reveal className="flex lift flex-col gap-4 rounded-3xl border border-primary-100 bg-card p-6 lg:col-span-2">
            <span className="icon-chip flex size-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
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

          <Reveal
            delay={80}
            className="flex lift flex-col gap-4 rounded-3xl border border-primary-100 bg-card p-6"
          >
            <span className="icon-chip flex size-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
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
            delay={120}
            className="flex lift flex-col gap-4 rounded-3xl border border-primary-100 bg-card p-6 lg:col-span-3"
          >
            <div className="flex gap-4">
              <span className="icon-chip flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Mail aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Email</h2>
                <p className="mt-1 text-muted-foreground">Kami membalas di jam kerja.</p>
              </div>
            </div>
            <ul aria-label="Alamat email" className="grid gap-4 sm:grid-cols-3">
              {siteConfig.emails.map((item) => (
                <li key={item.address} className="min-w-0">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <a
                    href={`mailto:${item.address}`}
                    className="inline-flex min-h-11 items-center font-semibold break-all text-primary-700 underline-offset-4 hover:underline"
                  >
                    {item.address}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={160}
            className="flex lift flex-col gap-4 rounded-3xl border border-primary-100 bg-card p-6 lg:col-span-3 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex gap-4">
              <span className="icon-chip flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
              <address className="not-italic">
                <h2 className="text-xl font-bold">Kantor pemasaran</h2>
                <p className="mt-1 max-w-xl">{formatOfficeAddress()}</p>
              </address>
            </div>
            <div>
              <Button asChild variant="outline">
                <a href={officeMapsUrl()} target="_blank" rel="noopener noreferrer">
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
        <Reveal className="max-w-3xl rounded-3xl border border-primary-100 bg-card p-5 shadow-xs sm:p-6">
          <LeadForm formKind="kontak" idPrefix="kontak" />
        </Reveal>
      </Section>
    </>
  );
}
