import { describe, expect, it } from "vitest";
import { careerSchema, postSchema } from "./content";

const post = {
  title: "Judul berita uji",
  slug: "judul-berita-uji",
  excerpt: "Ringkasan berita uji yang cukup panjang.",
  body: [{ type: "paragraph", text: "Isi" }],
  status: "draft",
};

describe("postSchema", () => {
  it("menerima berita minimal", () => {
    expect(postSchema.safeParse(post).success).toBe(true);
  });

  it("slug harus huruf kecil dan tanda hubung", () => {
    const result = postSchema.safeParse({ ...post, slug: "Judul Berita" });
    expect(result.error?.issues[0]?.message).toMatch(/Slug hanya huruf kecil/);
  });

  it("ringkasan maksimal 160 karakter dan isi minimal satu blok", () => {
    expect(postSchema.safeParse({ ...post, excerpt: "x".repeat(161) }).success).toBe(false);
    expect(postSchema.safeParse({ ...post, body: [] }).error?.issues[0]?.message).toBe(
      "Isi berita minimal satu paragraf.",
    );
  });

  it("sampul tanpa teks alternatif ditolak", () => {
    const result = postSchema.safeParse({
      ...post,
      coverPath: "https://contoh.id/a.webp",
      coverAlt: "",
    });
    expect(result.error?.issues[0]?.path).toEqual(["coverAlt"]);
  });
});

describe("careerSchema", () => {
  const career = {
    title: "Staf teknik sipil",
    slug: "staf-teknik-sipil",
    level: "magang",
    description: [{ type: "paragraph", text: "Isi" }],
    requirements: [],
    status: "terbit",
  };

  it("menerima jenjang yang dikenal dan tanggal tutup kosong", () => {
    expect(careerSchema.safeParse({ ...career, closesOn: "" }).success).toBe(true);
    expect(careerSchema.safeParse({ ...career, closesOn: "2026-12-31" }).success).toBe(true);
  });

  it("menolak jenjang tidak dikenal dan tanggal salah format", () => {
    expect(careerSchema.safeParse({ ...career, level: "direktur" }).success).toBe(false);
    expect(careerSchema.safeParse({ ...career, closesOn: "31-12-2026" }).success).toBe(false);
  });
});
