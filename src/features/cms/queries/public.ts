import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/config/cache-tags";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { handleContentError } from "@/lib/supabase/query-error";
import type {
  Banner,
  Career,
  CareerSummary,
  Post,
  PostSummary,
  Promo,
  PromoSummary,
} from "../types";
import {
  toBanner,
  toCareer,
  toCareerSummary,
  toPost,
  toPostSummary,
  toPromo,
  toPromoSummary,
} from "../utils/map";
import { parseHomeStats, type HomeStat } from "../utils/stats";

// Konten website yang terbit (RLS anon). Di-cache per tag, diperbarui dari admin (Fase 4) atau paling
// lama tiap jam, supaya promo dan lowongan yang berakhir hilang dengan sendirinya.

/** Banner beranda yang terbit dan sedang berlaku, urut sesuai admin. */
export async function getActiveBanners(): Promise<Banner[]> {
  "use cache";
  cacheTag(CACHE_TAGS.banners);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("banners")
    .select("*")
    .order("sort_order");
  if (error) return handleContentError("banner", error, []);
  return data.map(toBanner);
}

const POST_SUMMARY = "id, slug, title, excerpt, cover_path, cover_alt, published_at";

/** Berita terbit, terbaru lebih dulu. */
export async function getPublishedPosts(limit = 30): Promise<PostSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("posts")
    .select(POST_SUMMARY)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return handleContentError("berita", error, []);
  return data.map(toPostSummary).filter((post) => post !== null);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return handleContentError("berita", error, null);
  return data ? toPost(data) : null;
}

const PROMO_SUMMARY = "id, slug, title, summary, cover_path, cover_alt, starts_at, ends_at";

/** Promo terbit yang sedang berlaku, yang paling cepat berakhir lebih dulu. */
export async function getActivePromos(): Promise<PromoSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.promos);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("promos")
    .select(PROMO_SUMMARY)
    .order("ends_at", { ascending: true, nullsFirst: false });
  if (error) return handleContentError("promo", error, []);
  return data.map(toPromoSummary);
}

export async function getPromoBySlug(slug: string): Promise<Promo | null> {
  "use cache";
  cacheTag(CACHE_TAGS.promos);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("promos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return handleContentError("promo", error, null);
  return data ? toPromo(data) : null;
}

const CAREER_SUMMARY = "id, slug, title, department, location, employment_type, closes_on";

/** Lowongan terbit yang belum tutup. */
export async function getOpenCareers(): Promise<CareerSummary[]> {
  "use cache";
  cacheTag(CACHE_TAGS.careers);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("careers")
    .select(CAREER_SUMMARY)
    .order("created_at", { ascending: false });
  if (error) return handleContentError("lowongan", error, []);
  return data.map(toCareerSummary);
}

export async function getCareerBySlug(slug: string): Promise<Career | null> {
  "use cache";
  cacheTag(CACHE_TAGS.careers);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("careers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return handleContentError("lowongan", error, null);
  return data ? toCareer(data) : null;
}

/** Angka strip statistik beranda dari site_settings (publik). Kosong kalau belum diisi. */
export async function getHomeStats(): Promise<HomeStat[]> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("site_settings")
    .select("value")
    .eq("key", "stats.home")
    .maybeSingle();
  if (error) return handleContentError("statistik", error, []);
  return parseHomeStats(data?.value);
}
