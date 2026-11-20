import type { Database } from "@/lib/supabase/database.types";
import type { Banner } from "../types";

type BannerRow = Database["public"]["Tables"]["banners"]["Row"];

export function toBanner(row: BannerRow): Banner {
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
