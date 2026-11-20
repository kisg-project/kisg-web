import type { Metadata } from "next";
import Link from "next/link";
import { LegalBody } from "@/components/site/legal-page";
import { PageHero } from "@/components/site/page-hero";
import { TERMS_UPDATED } from "@/config/legal";
import { siteConfig } from "@/config/site";
import { formatDateWIB } from "@/lib/format";

export const metadata: Metadata = {
  title: "Syarat dan ketentuan",
  description:
    "Syarat pemakaian website KIS Group, termasuk sifat informasi harga, promo, dan simulasi KPR.",
  alternates: { canonical: "/syarat-ketentuan" },
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Syarat dan ketentuan"
        description={`Diperbarui ${formatDateWIB(TERMS_UPDATED)}.`}
        crumbs={[{ name: "Syarat dan ketentuan", path: "/syarat-ketentuan" }]}
      />
      <LegalBody>
        <p>
          Website {siteConfig.domain} dikelola oleh {siteConfig.legalName}. Dengan memakai website
          ini, Anda menyetujui syarat berikut.
        </p>

        <h2>Informasi di website</h2>
        <ul>
          <li>
            Harga, promo, spesifikasi, dan ketersediaan unit dapat berubah. Informasi yang mengikat
            adalah yang tertulis di surat pemesanan dan perjanjian jual beli.
          </li>
          <li>
            Foto dan gambar menunjukkan rancangan rumah. Hasil bangunan dapat berbeda sedikit sesuai
            kondisi lapangan.
          </li>
          <li>
            Promo berlaku sesuai masa berlaku dan syarat yang tertulis di halaman promo
            masing-masing.
          </li>
        </ul>

        <h2>Simulasi KPR</h2>
        <p>
          Hasil simulasi adalah perkiraan berdasarkan angka yang Anda masukkan. Bunga, margin,
          biaya, dan persetujuan kredit ditentukan oleh bank. KIS Group tidak menjamin persetujuan
          KPR.
        </p>

        <h2>Data pribadi</h2>
        <p>
          Data yang Anda kirim lewat form diproses sesuai{" "}
          <Link href="/kebijakan-privasi">kebijakan privasi</Link>.
        </p>

        <h2>Hak cipta</h2>
        <p>
          Logo, foto, dan isi website ini milik KIS Group. Penggunaan ulang untuk kepentingan
          komersial butuh izin tertulis.
        </p>

        <h2>Hukum yang berlaku</h2>
        <p>Syarat ini tunduk pada hukum Republik Indonesia.</p>
      </LegalBody>
    </>
  );
}
