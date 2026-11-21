import type { Metadata } from "next";
import { LegalBody } from "@/components/site/legal-page";
import { PageHero } from "@/components/site/page-hero";
import { PRIVACY_POLICY_UPDATED } from "@/config/legal";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";
import { formatDateWIB } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/kebijakan-privasi",
  title: "Kebijakan privasi",
  description:
    "Cara KIS Group mengumpulkan, memakai, dan melindungi data pribadi pengunjung website dan calon pembeli.",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Kebijakan privasi"
        description={`Diperbarui ${formatDateWIB(PRIVACY_POLICY_UPDATED)}.`}
        crumbs={[{ name: "Kebijakan privasi", path: "/kebijakan-privasi" }]}
      />
      <LegalBody>
        <p>
          Kebijakan ini menjelaskan data pribadi yang dikumpulkan {siteConfig.legalName} (KIS Group)
          lewat website {siteConfig.domain}, untuk apa data itu dipakai, dan hak Anda atasnya sesuai
          Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.
        </p>

        <h2>Data yang kami kumpulkan</h2>
        <ul>
          <li>
            Data yang Anda isi di form: nama, nomor HP, email (kalau diisi), pesan, proyek atau tipe
            unit yang diminati. Untuk lamaran kerja: nama, nomor HP, email, dan file CV.
          </li>
          <li>
            Data kunjungan: halaman asal, sumber kunjungan (parameter UTM dan kode klik iklan),
            jenis browser, dan alamat IP. Alamat IP disimpan dalam bentuk acak satu arah (hash)
            untuk mencegah penyalahgunaan form.
          </li>
          <li>Percakapan dengan marketing lewat WhatsApp, kalau Anda menghubungi kami.</li>
        </ul>

        <h2>Untuk apa data dipakai</h2>
        <ul>
          <li>Menghubungi Anda soal unit, harga, simulasi KPR, dan jadwal survei.</li>
          <li>Memproses lamaran kerja.</li>
          <li>
            Mengukur iklan yang membawa Anda ke website, supaya iklan kami lebih tepat sasaran.
          </li>
          <li>Menjaga keamanan website dan mencegah spam.</li>
        </ul>
        <p>
          Kami hanya memakai data form setelah Anda memberi persetujuan lewat kotak centang di form.
          Kami tidak menjual data pribadi Anda.
        </p>

        <h2>Pihak yang ikut memproses data</h2>
        <p>
          Data disimpan dan diproses oleh penyedia layanan yang kami pakai untuk menjalankan
          website: penyedia hosting dan database, layanan email, dan platform iklan untuk
          pengukuran. Data yang dikirim ke platform iklan berupa kode acak (hash) dari nomor HP atau
          email, bukan teks aslinya.
        </p>

        <h2>Berapa lama data disimpan</h2>
        <p>
          Selama masih dibutuhkan untuk tujuan di atas, atau sampai Anda meminta penghapusan,
          kecuali data yang wajib disimpan lebih lama menurut peraturan.
        </p>

        <h2>Hak Anda</h2>
        <ul>
          <li>Meminta salinan data pribadi Anda.</li>
          <li>Meminta perbaikan data yang salah.</li>
          <li>Meminta penghapusan data, atau menarik persetujuan kapan saja.</li>
          <li>Menolak dihubungi untuk penawaran.</li>
        </ul>
        <p>
          Sampaikan permintaan lewat{" "}
          <a
            href={whatsappLink("Halo, saya ingin mengajukan permintaan terkait data pribadi saya.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {siteConfig.whatsapp.display}
          </a>{" "}
          atau datang ke kantor kami: {formatOfficeAddress()}. Kami menjawab paling lambat 3 x 24
          jam hari kerja.
        </p>

        <h2>Perubahan kebijakan</h2>
        <p>
          Kalau kebijakan ini berubah, tanggal pembaruan di atas ikut berubah. Persetujuan di form
          selalu mengacu ke versi yang berlaku saat Anda mengirimnya.
        </p>
      </LegalBody>
    </>
  );
}
