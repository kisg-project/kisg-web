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
    display: "+62 896-7329-6881",
    e164: "+6289673296881",
    url: "https://wa.me/6289673296881",
  },
  instagram: {
    handle: "@kreatifsejahteraproject",
    url: "https://instagram.com/kreatifsejahteraproject",
  },
  logo: {
    src: "/brand/logo-kis.png",
    width: 966,
    height: 572,
    alt: "Logo KIS Group",
  },
  featuredProject: {
    name: "Sejahtera Green Village",
    area: "Tambun Selatan",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Alamat kantor dalam satu baris, untuk footer dan halaman kontak. */
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
