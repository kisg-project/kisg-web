/**
 * Slug URL dari judul: huruf kecil, tanpa aksen, kata dipisah tanda hubung. Sama dengan aturan
 * constraint slug di database (^[a-z0-9]+(-[a-z0-9]+)*$).
 */
export function slugify(title: string, maxLength = 80): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
