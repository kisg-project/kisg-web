import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { parseBlocks, parseTextList, toCareer, toPost, toPostSummary, toPromo } from "./map";

type Tables = Database["public"]["Tables"];
const base = {
  created_at: "2026-11-20T00:00:00Z",
  updated_at: "2026-11-20T00:00:00Z",
  created_by: null,
  deleted_at: null,
};

describe("parseBlocks", () => {
  it("menerima paragraf, judul, dan daftar", () => {
    expect(
      parseBlocks([
        { type: "heading", text: "Judul" },
        { type: "paragraph", text: "Isi" },
        { type: "list", items: ["Satu", "Dua"] },
      ]),
    ).toHaveLength(3);
  });

  it("melewati blok rusak atau tipe tidak dikenal, termasuk HTML mentah", () => {
    expect(
      parseBlocks([
        { type: "paragraph", text: "" },
        { type: "html", html: "<script>alert(1)</script>" },
        { type: "list", items: [] },
        "teks",
        { type: "paragraph", text: "Aman" },
      ]),
    ).toEqual([{ type: "paragraph", text: "Aman" }]);
    expect(parseBlocks(null)).toEqual([]);
  });

  it("menerima daftar sumber hanya dengan tautan https", () => {
    expect(
      parseBlocks([
        { type: "sources", items: [{ label: "Bank Indonesia", url: "https://www.bi.go.id/a" }] },
        { type: "sources", items: [{ label: "Bahaya", url: "javascript:alert(1)" }] },
        { type: "sources", items: [{ label: "Tidak aman", url: "http://contoh.id" }] },
        { type: "sources", items: [] },
      ]),
    ).toEqual([
      { type: "sources", items: [{ label: "Bank Indonesia", url: "https://www.bi.go.id/a" }] },
    ]);
  });
});

describe("parseTextList", () => {
  it("hanya teks yang berisi", () => {
    expect(parseTextList(["Satu", "", 3, " Dua "])).toEqual(["Satu", "Dua"]);
    expect(parseTextList({})).toEqual([]);
  });
});

describe("berita", () => {
  const row: Tables["posts"]["Row"] = {
    ...base,
    id: "p1",
    slug: "serah-terima",
    title: "Serah terima",
    excerpt: "Ringkas",
    body: [{ type: "paragraph", text: "Isi" }],
    cover_path: "/c.webp",
    cover_alt: "Sampul",
    content_status: "terbit",
    scheduled_at: null,
    published_at: "2026-11-01T00:00:00Z",
    author_id: null,
  };

  it("memetakan berita terbit lengkap dengan sampul dan isi", () => {
    expect(toPost(row)).toMatchObject({
      slug: "serah-terima",
      cover: { src: "/c.webp", alt: "Sampul" },
      body: [{ type: "paragraph", text: "Isi" }],
    });
  });

  it("berita tanpa tanggal terbit dan sampul tanpa alt tidak dipakai", () => {
    expect(toPostSummary({ ...row, published_at: null })).toBeNull();
    expect(toPost({ ...row, cover_alt: null })?.cover).toBeNull();
  });
});

describe("promo dan lowongan", () => {
  it("memetakan promo dengan syarat", () => {
    const promo = toPromo({
      ...base,
      id: "pr1",
      slug: "promo",
      title: "Promo",
      summary: null,
      body: [],
      terms: "Syarat",
      project_id: null,
      cover_path: null,
      cover_alt: null,
      starts_at: null,
      ends_at: "2026-12-31T00:00:00Z",
      content_status: "terbit",
    });
    expect(promo).toMatchObject({ terms: "Syarat", endsAt: "2026-12-31T00:00:00Z", cover: null });
  });

  it("memetakan lowongan dengan daftar syarat", () => {
    const career = toCareer({
      ...base,
      id: "c1",
      slug: "marketing",
      title: "Marketing",
      department: "Pemasaran",
      location: "Bekasi",
      employment_type: "Penuh waktu",
      description: [{ type: "paragraph", text: "Tugas" }],
      requirements: ["Domisili Bekasi"],
      closes_on: "2026-12-31",
      level: "lulusan_baru",
      content_status: "terbit",
    });
    expect(career).toMatchObject({
      requirements: ["Domisili Bekasi"],
      department: "Pemasaran",
      level: "lulusan_baru",
    });
    expect(career.description).toHaveLength(1);
  });
});
