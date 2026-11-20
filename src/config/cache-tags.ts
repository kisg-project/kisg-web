// Tag cache konten publik. Halaman website di-cache ("use cache") dan diperbarui lewat revalidateTag
// saat admin menyimpan perubahan (Fase 4). Satu sumber supaya query dan aksi admin memakai nama sama.

export const CACHE_TAGS = {
  projects: "projects",
  banners: "banners",
  posts: "posts",
  promos: "promos",
  careers: "careers",
  faqs: "faqs",
  settings: "site-settings",
} as const;

export function projectTag(slug: string): string {
  return `project:${slug}`;
}
