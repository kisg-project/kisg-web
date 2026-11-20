import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/config/cache-tags";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { handleContentError } from "@/lib/supabase/query-error";
import type { Banner } from "../types";
import { toBanner } from "../utils/map";

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
