// Navigasi website (Fase 3). Selama hanya ada satu proyek terbit, menu "Proyek" langsung menuju
// halaman detailnya (docs/architecture.md). Href proyek ditentukan header dari data proyek terbit.

export interface NavItem {
  label: string;
  href: string;
}

export const PROJECTS_PATH = "/proyek";

export const siteNav: readonly NavItem[] = [
  { label: "Proyek", href: PROJECTS_PATH },
  { label: "Simulasi KPR", href: "/simulasi-kpr" },
  { label: "Promo", href: "/promo" },
  { label: "Berita", href: "/berita" },
  { label: "Karir", href: "/karir" },
  { label: "Tentang", href: "/tentang" },
  { label: "Kontak", href: "/kontak" },
];

export const footerNav: readonly { title: string; items: readonly NavItem[] }[] = [
  {
    title: "Jelajahi",
    items: [
      { label: "Proyek", href: PROJECTS_PATH },
      { label: "Simulasi KPR", href: "/simulasi-kpr" },
      { label: "Promo", href: "/promo" },
      { label: "Berita", href: "/berita" },
    ],
  },
  {
    title: "Perusahaan",
    items: [
      { label: "Tentang KIS Group", href: "/tentang" },
      { label: "Karir", href: "/karir" },
      { label: "Kontak", href: "/kontak" },
    ],
  },
  {
    title: "Informasi",
    items: [
      { label: "Kebijakan privasi", href: "/kebijakan-privasi" },
      { label: "Syarat dan ketentuan", href: "/syarat-ketentuan" },
    ],
  },
];

/** Menu dengan href proyek yang sudah disesuaikan (detail kalau hanya satu proyek terbit). */
export function withProjectsHref<T extends NavItem>(
  items: readonly T[],
  projectsHref: string,
): T[] {
  return items.map((item) =>
    item.href === PROJECTS_PATH ? { ...item, href: projectsHref } : item,
  );
}
