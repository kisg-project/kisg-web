// Satu-satunya sumber data perusahaan (CLAUDE.md bagian 1).
// Nilai di sini bisa ditimpa dari tabel site_settings lewat admin (Fase 4).

export const siteConfig = {
  name: "KIS Group",
  legalName: "PT Kreatif Inovatif Sejahtera Group",
  domain: "kisgroup.co.id",
  locale: "id-ID",
  timeZone: "Asia/Jakarta",
  address: {
    street: "Ruko D'Smart, Jl. Telaga Mas No. 55 Blok H, RT 012/RW 014",
    village: "Harapan Baru",
    district: "Bekasi Utara",
    city: "Kota Bekasi",
    province: "Jawa Barat",
    postalCode: "17123",
  },
  whatsapp: {
    display: "+62 882-9095-7177",
    e164: "+6288290957177",
    url: "https://wa.me/6288290957177",
  },
  instagram: {
    handle: "@kreatifsejahteraproject",
    url: "https://instagram.com/kreatifsejahteraproject",
  },
  logo: {
    src: "/brand/logo-kis.png",
    /** Versi untuk latar gelap (footer): atap dan tulisan GROUP putih, KIS tetap emas. */
    lightSrc: "/brand/logo-kis-light.png",
    width: 966,
    height: 572,
    alt: "Logo KIS Group",
  },
  featuredProject: {
    name: "Sejahtera Green Village",
    area: "Tambun Selatan",
  },
  // Dari Company Profile PT KISG (2024). Kalimat ditulis ulang tanpa frasa klise (CLAUDE.md bagian 7),
  // fakta tidak diubah. Visi dan misi dikutip sesuai dokumen.
  company: {
    foundedYear: 2022,
    summary: [
      "KIS Group membangun rumah untuk keluarga di Kabupaten Bekasi, dengan harga yang terjangkau untuk rumah pertama.",
      "Perusahaan berdiri tahun 2022. Setiap proyek dipilih dekat fasilitas umum seperti transportasi dan pusat belanja, dengan desain rumah yang fungsional.",
    ],
    vision:
      "Menjadi pengembang properti yang terpercaya dalam menciptakan hunian terjangkau dan berkualitas bagi keluarga Indonesia, dengan fokus pada keberlanjutan dan kesejahteraan masyarakat.",
    missions: [
      "Membangun rumah dan kawasan perumahan yang terjangkau tanpa mengorbankan kualitas dan kenyamanan bagi penghuninya.",
      "Mengembangkan proyek perumahan yang strategis, dekat dengan fasilitas umum, dan dapat diakses oleh masyarakat berpenghasilan menengah ke bawah.",
      "Menyediakan solusi pembiayaan yang memudahkan calon pembeli untuk memiliki rumah pertama mereka.",
      "Menjaga transparansi dan memberikan pelayanan terbaik bagi setiap pelanggan.",
    ],
    services: [
      {
        title: "Pengembangan perumahan",
        body: "Membangun rumah dengan material dan teknik konstruksi yang tepat, berikut jalan lingkungan, jaringan air bersih, dan ruang terbuka hijau.",
      },
      {
        title: "Solusi pembiayaan",
        body: "Bekerja sama dengan bank dan lembaga keuangan untuk KPR rumah pertama.",
      },
      {
        title: "Konsultasi properti",
        body: "Membantu calon pembeli memilih unit sesuai kebutuhan dan anggaran, sampai proses pembelian dan pembiayaan selesai.",
      },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Alamat kantor dalam satu baris, untuk footer dan halaman kontak. */
/** Tautan Google Maps ke kantor pemasaran (pencarian alamat lengkap, tanpa API key). */
export function officeMapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${siteConfig.legalName}, ${formatOfficeAddress()}`,
  )}`;
}

export function formatOfficeAddress(address: SiteConfig["address"] = siteConfig.address): string {
  return [
    address.street,
    address.village,
    address.district,
    address.city,
    `${address.province} ${address.postalCode}`,
  ].join(", ");
}

/** Link WhatsApp dengan pesan pembuka. */
export function whatsappLink(message?: string): string {
  if (!message) return siteConfig.whatsapp.url;
  return `${siteConfig.whatsapp.url}?text=${encodeURIComponent(message)}`;
}
