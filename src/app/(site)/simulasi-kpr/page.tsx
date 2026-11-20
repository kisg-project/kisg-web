import type { Metadata } from "next";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/site/page-hero";
import { siteConfig } from "@/config/site";
import { AkadInfo, KprSimulatorTabs, PartnerBanks } from "@/features/kpr";
import { getFeaturedProject } from "@/features/projects";
import { formatRupiah } from "@/lib/format";

/** Harga contoh kalkulator kalau belum ada tipe unit berharga di database. */
const EXAMPLE_PRICE = 500_000_000;

export async function generateMetadata(): Promise<Metadata> {
  const project = await getFeaturedProject();
  const name = project?.name ?? siteConfig.name;
  const description = `Simulasi KPR konvensional dan KPR syariah ${name}: pilih produk bank, atur uang muka dan jangka waktu, lihat angsuran, rincian biaya, dan jadwal, lalu unduh PDF.`;
  return {
    title: "Simulasi KPR",
    description: description.slice(0, 160),
    alternates: { canonical: "/simulasi-kpr" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/simulasi-kpr",
      siteName: siteConfig.name,
      title: `Simulasi KPR ${name}`,
      description,
      images: project?.cover ? [{ url: project.cover.src, alt: project.cover.alt }] : [],
    },
  };
}

export default async function SimulasiKprPage() {
  const project = await getFeaturedProject();
  const unit = project?.unitTypes.find((item) => item.price !== null);
  // Tanpa harga dari database, kalkulator memakai harga contoh yang bisa diubah pengunjung.
  const price = unit?.price ?? EXAMPLE_PRICE;

  return (
    <>
      <PageHero
        title="Simulasi KPR"
        crumbs={[{ name: "Simulasi KPR", path: "/simulasi-kpr" }]}
        description={
          project && unit ? (
            <>
              {project.name}, rumah {unit.name} seharga{" "}
              <span className="font-semibold text-white tabular">{formatRupiah(price)}</span>. Pilih
              produk bank, atur uang muka dan jangka waktu, lalu unduh hasilnya dalam PDF.
            </>
          ) : (
            "Pilih produk bank, atur uang muka dan jangka waktu, lalu unduh hasilnya dalam PDF."
          )
        }
      />

      <Section aria-label="Kalkulator simulasi KPR">
        <KprSimulatorTabs
          price={price}
          projectName={project?.name ?? siteConfig.name}
          unitName={unit?.name ?? "Rumah"}
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
