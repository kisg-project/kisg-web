import type { NextRequest } from "next/server";
import { careerLevelBySlug } from "@/config/careers";
import { getCareerBySlug, getPostBySlug, getPromoBySlug } from "@/features/cms";
import { getProjectBySlug } from "@/features/projects";
import { isOgPagePath, OG_PAGES } from "@/lib/seo/page-metadata";
import { renderOgImage } from "@/lib/seo/og-image";

interface OgContent {
  title: string;
  subtitle: string;
  /** Path foto (public atau Supabase Storage). Kosong: foto sampul proyek unggulan. */
  photo?: string | null;
}

/** Judul, keterangan, dan foto untuk path halaman. null: path tidak dikenal atau kontennya tidak ada. */
async function resolve(path: string): Promise<OgContent | null> {
  if (isOgPagePath(path)) return OG_PAGES[path];
  const [, section, slug, extra] = path.split("/");
  if (!slug) return null;
  if (section === "proyek" && !extra) {
    const project = await getProjectBySlug(slug);
    if (!project) return null;
    const area = [project.address.district, project.address.city].filter(Boolean).join(", ");
    return {
      title: project.name,
      subtitle: area ? `Perumahan di ${area}.` : "Perumahan KIS Group.",
      photo: project.cover?.src,
    };
  }
  if (section === "berita" && !extra) {
    const post = await getPostBySlug(slug);
    if (!post) return null;
    return {
      title: post.title,
      subtitle: post.excerpt ?? "Berita KIS Group.",
      photo: post.cover?.src,
    };
  }
  if (section === "promo" && !extra) {
    const promo = await getPromoBySlug(slug);
    if (!promo) return null;
    return {
      title: promo.title,
      subtitle: promo.summary ?? "Promo KIS Group.",
      photo: promo.cover?.src,
    };
  }
  if (section === "karir" && slug === "jenjang" && extra) {
    const level = careerLevelBySlug(extra);
    if (!level) return null;
    return { title: `Karir: ${level.title}`, subtitle: level.description, photo: level.image.src };
  }
  if (section === "karir" && !extra) {
    const career = await getCareerBySlug(slug);
    if (!career) return null;
    const detail = [career.department, career.location].filter(Boolean).join(", ");
    return {
      title: `Lowongan ${career.title}`,
      subtitle: detail
        ? `${detail}. Kirim lamaran lewat website KIS Group.`
        : "Kirim lamaran lewat website KIS Group.",
    };
  }
  return null;
}

/**
 * Foto halaman dalam JPEG lewat pengoptimal gambar Next (pembuat gambar share tidak membaca WebP).
 * Gagal mengambil foto tidak menggagalkan gambar share: foto bawaan dipakai.
 */
async function loadPhoto(origin: string, src: string) {
  try {
    const url = new URL(`/_next/image?url=${encodeURIComponent(src)}&w=1200&q=75`, origin);
    const response = await fetch(url, { headers: { Accept: "image/jpeg,image/png" } });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/^image\/(jpeg|png)$/.test(type)) return null;
    return { data: await response.arrayBuffer(), type };
  } catch {
    return null;
  }
}

/**
 * Gambar share bermerek (1200x630): /og?p=/simulasi-kpr atau /og?p=/berita/<slug>. Hanya path halaman
 * terdaftar atau konten yang ada di database, supaya tidak bisa dipakai membuat gambar berisi teks bebas.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("p") ?? "/";
  const content = path.length <= 200 ? await resolve(path) : null;
  if (!content) return new Response("Tidak ditemukan", { status: 404 });
  const photo = content.photo ? await loadPhoto(request.nextUrl.origin, content.photo) : null;
  return renderOgImage({ title: content.title, subtitle: content.subtitle, photo });
}
