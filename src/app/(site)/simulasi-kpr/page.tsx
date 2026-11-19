import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { featuredProject } from "@/config/featured-project";
import { siteConfig } from "@/config/site";
import { AkadInfo, KprSimulatorTabs, PartnerBanks } from "@/features/kpr";
import { formatRupiah } from "@/lib/format";

const description = `Simulasi KPR konvensional dan KPR syariah ${featuredProject.name}: pilih produk bank, atur uang muka dan jangka waktu, lihat angsuran, rincian biaya, dan jadwal, lalu unduh PDF.`;

export const metadata: Metadata = {
  title: "Simulasi KPR",
  description,
  alternates: { canonical: "/simulasi-kpr" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/simulasi-kpr",
    siteName: siteConfig.name,
    title: `Simulasi KPR ${featuredProject.name}`,
    description,
    images: [{ url: "/images/hero/sgv-hero-desktop.webp", width: 2048, height: 1337 }],
  },
};

export default function SimulasiKprPage() {
  return (
    <>
      <div className="border-b bg-surface">
        <Container className="py-10 sm:py-12">
          <p className="text-sm font-semibold text-highlight-text">{featuredProject.name}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Simulasi KPR</h1>
          <p className="mt-3 max-w-2xl text-subtle-foreground">
            Rumah {featuredProject.unitType.name} seharga{" "}
            <span className="font-semibold text-foreground tabular">
              {formatRupiah(featuredProject.unitType.price)}
            </span>
            . Pilih produk bank, atur uang muka dan jangka waktu, lalu unduh hasilnya dalam PDF.
          </p>
        </Container>
      </div>

      <Section aria-label="Kalkulator simulasi KPR">
        <KprSimulatorTabs
          price={featuredProject.unitType.price}
          projectName={featuredProject.name}
          unitName={featuredProject.unitType.name}
        />
      </Section>

      <Section id="bank" tone="surface" title="Bank rekanan">
        <PartnerBanks />
      </Section>

      <Section
        id="akad"
        title="Akad dalam KPR syariah"
        description="KPR syariah memakai akad yang disepakati di awal. Bank rekanan menentukan akad yang tersedia untuk setiap produk."
      >
        <AkadInfo />
      </Section>
    </>
  );
}
