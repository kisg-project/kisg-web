import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { toBanner } from "./map";

const row: Database["public"]["Tables"]["banners"]["Row"] = {
  id: "b1",
  title: "Sejahtera Green Village",
  subtitle: "Rumah Tipe 36/60",
  image_path: "/d.webp",
  mobile_image_path: null,
  alt: "Deretan rumah",
  cta_label: "Lihat proyek",
  cta_href: "/proyek/sejahtera-green-village",
  starts_at: null,
  ends_at: null,
  sort_order: 1,
  content_status: "terbit",
  created_at: "2026-11-20T00:00:00Z",
  updated_at: "2026-11-20T00:00:00Z",
  created_by: null,
  deleted_at: null,
};

describe("toBanner", () => {
  it("memetakan banner dengan CTA", () => {
    expect(toBanner(row)).toEqual({
      id: "b1",
      title: "Sejahtera Green Village",
      subtitle: "Rumah Tipe 36/60",
      image: "/d.webp",
      mobileImage: null,
      alt: "Deretan rumah",
      cta: { label: "Lihat proyek", href: "/proyek/sejahtera-green-village" },
    });
  });

  it("tanpa CTA kalau label atau tautan kosong", () => {
    expect(toBanner({ ...row, cta_label: null }).cta).toBeNull();
  });
});
