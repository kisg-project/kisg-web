import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, projectTag } from "@/config/cache-tags";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { handleContentError } from "@/lib/supabase/query-error";
import type { ProjectDetail, ProjectSummary } from "../types";
import {
  toAddress,
  toFacility,
  toFaq,
  toImages,
  toNearby,
  toUnitType,
  toUpdate,
} from "../utils/map";

// Query konten proyek untuk website. Hanya baris yang lolos RLS anon (proyek terbit). Di-cache dan
// diperbarui lewat revalidateTag dari admin (Fase 4), atau paling lama tiap jam.

const SUMMARY_SELECT =
  "id, slug, name, status, tagline, address, village, district, city, province, postal_code, sort_order, is_featured, unit_types(*), project_media(*)";

type SummaryRow = Awaited<ReturnType<typeof fetchSummaries>>[number];

async function fetchSummaries() {
  const { data, error } = await createSupabasePublicClient()
    .from("projects")
    .select(SUMMARY_SELECT)
    .order("is_featured", { ascending: false })
    .order("sort_order");
  if (error) return handleContentError("proyek", error, []);
  return data;
}

function toSummary(row: SummaryRow): ProjectSummary {
  const images = toImages(row.project_media);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    tagline: row.tagline,
    address: toAddress(row),
    cover: images[0] ?? null,
    unitTypes: row.unit_types.toSorted((a, b) => a.sort_order - b.sort_order).map(toUnitType),
  };
}

/** Semua proyek terbit, proyek unggulan lebih dulu. */
export async function getPublishedProjects(): Promise<ProjectSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("hours");
  return (await fetchSummaries()).map(toSummary);
}

/** Proyek unggulan untuk beranda, atau null kalau belum ada proyek terbit. */
export async function getFeaturedProject(): Promise<ProjectDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("hours");
  const [first] = await fetchSummaries();
  return first ? getProjectBySlug(first.slug) : null;
}

/** Detail proyek terbit, atau null kalau slug tidak ada atau belum terbit. */
export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheTag(CACHE_TAGS.projects, projectTag(slug));
  cacheLife("hours");
  const supabase = createSupabasePublicClient();
  const { data: row, error } = await supabase
    .from("projects")
    .select(
      "*, unit_types(*), project_media(*), nearby_places(*), facilities(*), faqs(*), construction_updates(*)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) return handleContentError(`proyek ${slug}`, error, null);
  if (!row) return null;

  const gallery = toImages(row.project_media);
  const bySort = <T extends { sort_order: number }>(items: T[]) =>
    items.toSorted((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    tagline: row.tagline,
    description: row.description,
    address: toAddress(row),
    lat: row.lat,
    lng: row.lng,
    cover: gallery[0] ?? null,
    gallery,
    unitTypes: bySort(row.unit_types).map(toUnitType),
    nearby: bySort(row.nearby_places).map(toNearby),
    facilities: bySort(row.facilities).map(toFacility),
    faqs: bySort(row.faqs).map(toFaq),
    updates: row.construction_updates
      .map(toUpdate)
      .filter((update) => update !== null)
      .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  };
}
