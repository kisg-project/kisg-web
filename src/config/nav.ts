// Navigasi website. Rute halaman terpisah (proyek, berita, promo, karir, kontak) ditambah di Fase 3.
// Selama hanya ada satu proyek terbit, menu proyek menuju bagian di beranda (docs/architecture.md).

export interface NavItem {
  label: string;
  href: string;
}

export const siteNav: readonly NavItem[] = [
  { label: "Tipe unit", href: "/#tipe-unit" },
  { label: "Simulasi KPR", href: "/simulasi-kpr" },
  { label: "Lokasi", href: "/#lokasi" },
];
