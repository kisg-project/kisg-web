import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import type {
  Banner,
  Career,
  CareerSummary,
  ContentBlock,
  ContentImage,
  Post,
  PostSummary,
  Promo,
  PromoSummary,
} from "../types";

type Tables = Database["public"]["Tables"];

export function toBanner(row: Tables["banners"]["Row"]): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    image: row.image_path,
    mobileImage: row.mobile_image_path,
    alt: row.alt,
    cta: row.cta_label && row.cta_href ? { label: row.cta_label, href: row.cta_href } : null,
  };
}

const text = z.string().trim().min(1);
const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text }),
  z.object({ type: z.literal("heading"), text }),
  z.object({ type: z.literal("list"), items: z.array(text).min(1) }),
]);

/** Isi konten dari kolom jsonb. Blok yang tidak sesuai skema dilewati, bukan merusak halaman. */
export function parseBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = blockSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Daftar teks dari kolom jsonb (misal syarat lowongan). */
export function parseTextList(value: unknown): string[] {
  const parsed = z.array(z.unknown()).safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.flatMap((item) => {
    const entry = text.safeParse(item);
    return entry.success ? [entry.data] : [];
  });
}

function toCover(path: string | null, alt: string | null): ContentImage | null {
  return path && alt ? { src: path, alt } : null;
}

type PostRow = Pick<
  Tables["posts"]["Row"],
  "id" | "slug" | "title" | "excerpt" | "cover_path" | "cover_alt" | "published_at"
>;

export function toPostSummary(row: PostRow): PostSummary | null {
  if (!row.published_at) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover: toCover(row.cover_path, row.cover_alt),
    publishedAt: row.published_at,
  };
}

export function toPost(row: Tables["posts"]["Row"]): Post | null {
  const summary = toPostSummary(row);
  return summary ? { ...summary, body: parseBlocks(row.body) } : null;
}

type PromoRow = Pick<
  Tables["promos"]["Row"],
  "id" | "slug" | "title" | "summary" | "cover_path" | "cover_alt" | "starts_at" | "ends_at"
>;

export function toPromoSummary(row: PromoRow): PromoSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    cover: toCover(row.cover_path, row.cover_alt),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export function toPromo(row: Tables["promos"]["Row"]): Promo {
  return { ...toPromoSummary(row), body: parseBlocks(row.body), terms: row.terms };
}

type CareerRow = Pick<
  Tables["careers"]["Row"],
  "id" | "slug" | "title" | "department" | "location" | "employment_type" | "closes_on"
>;

export function toCareerSummary(row: CareerRow): CareerSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    employmentType: row.employment_type,
    closesOn: row.closes_on,
  };
}

export function toCareer(row: Tables["careers"]["Row"]): Career {
  return {
    ...toCareerSummary(row),
    description: parseBlocks(row.description),
    requirements: parseTextList(row.requirements),
  };
}
