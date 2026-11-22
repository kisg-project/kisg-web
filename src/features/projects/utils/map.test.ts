import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import {
  formatAddress,
  formatNearbyDistance,
  lowestPrice,
  shortArea,
  toAddress,
  toImages,
  toNearby,
  toUnitType,
  toUpdate,
} from "./map";

type Tables = Database["public"]["Tables"];

const base = {
  created_at: "2026-11-20T00:00:00Z",
  updated_at: "2026-11-20T00:00:00Z",
  created_by: null,
  deleted_at: null,
};

function unitRow(
  overrides: Partial<Tables["unit_types"]["Row"]> = {},
): Tables["unit_types"]["Row"] {
  return {
    ...base,
    id: "u1",
    project_id: "p1",
    slug: "tipe-36-60",
    name: "Tipe 36/60",
    land_area: 60,
    building_area: 36,
    bedrooms: 2,
    bathrooms: 1,
    floors: 1,
    specs: {
      features: ["Carport", "Smart door lock"],
      price_includes: ["Biaya notaris"],
      price_excludes: ["Asuransi"],
    },
    price_from: 571250000,
    show_price: true,
    floor_plan_path: null,
    sort_order: 1,
    ...overrides,
  };
}

function mediaRow(
  overrides: Partial<Tables["project_media"]["Row"]>,
): Tables["project_media"]["Row"] {
  return {
    ...base,
    id: "m",
    project_id: "p1",
    kind: "foto",
    path: "/a.webp",
    alt: "Foto",
    caption: null,
    width: 100,
    height: 50,
    sort_order: 0,
    ...overrides,
  };
}

describe("toUnitType", () => {
  it("memetakan kolom dan isi specs", () => {
    expect(toUnitType(unitRow())).toMatchObject({
      name: "Tipe 36/60",
      landArea: 60,
      buildingArea: 36,
      price: 571250000,
      features: ["Carport", "Smart door lock"],
      priceIncludes: ["Biaya notaris"],
      priceExcludes: ["Asuransi"],
    });
  });

  it("menyembunyikan harga kalau show_price mati atau harga kosong", () => {
    expect(toUnitType(unitRow({ show_price: false })).price).toBeNull();
    expect(toUnitType(unitRow({ price_from: null })).price).toBeNull();
  });

  it("memetakan spesifikasi bangunan dan mengabaikan baris yang tidak lengkap", () => {
    const unit = toUnitType(
      unitRow({ specs: { materials: [{ label: "Pondasi", value: "Cakar ayam" }] } }),
    );
    expect(unit.materials).toEqual([{ label: "Pondasi", value: "Cakar ayam" }]);
    expect(toUnitType(unitRow({ specs: { materials: [{ label: "" }] } })).materials).toEqual([]);
  });

  it("specs yang rusak tidak merusak halaman", () => {
    const unit = toUnitType(unitRow({ specs: { features: "bukan daftar" } }));
    expect(unit.features).toEqual([]);
    expect(toUnitType(unitRow({ specs: [] })).priceIncludes).toEqual([]);
  });
});

describe("toImages", () => {
  it("hanya foto berukuran, urut sesuai sort_order", () => {
    const images = toImages([
      mediaRow({ id: "b", sort_order: 2 }),
      mediaRow({ id: "a", sort_order: 1 }),
      mediaRow({ id: "denah", kind: "denah" }),
      mediaRow({ id: "tanpa-ukuran", width: null }),
    ]);
    expect(images.map((image) => image.id)).toEqual(["a", "b"]);
  });
});

describe("alamat", () => {
  const address = toAddress({
    address: "Jl. Garuda 3",
    village: "Mangunjaya",
    district: "Kec. Tambun Selatan",
    city: "Kab. Bekasi",
    province: "Jawa Barat",
    postal_code: "17510",
  });

  it("menggabungkan alamat satu baris", () => {
    expect(formatAddress(address)).toBe(
      "Jl. Garuda 3, Mangunjaya, Kec. Tambun Selatan, Kab. Bekasi, Jawa Barat 17510",
    );
  });

  it("melewati bagian yang kosong", () => {
    expect(formatAddress({ ...address, village: null, postalCode: null })).toBe(
      "Jl. Garuda 3, Kec. Tambun Selatan, Kab. Bekasi, Jawa Barat",
    );
  });

  it("nama kecamatan tanpa awalan", () => {
    expect(shortArea(address)).toBe("Tambun Selatan");
    expect(shortArea({ ...address, district: null })).toBeNull();
  });
});

describe("tempat sekitar", () => {
  const row: Tables["nearby_places"]["Row"] = {
    ...base,
    id: "n1",
    project_id: "p1",
    name: "Stasiun Tambun",
    category: "transportasi",
    distance_km: 2.5,
    travel_minutes: null,
    travel_mode: null,
    sort_order: 1,
  };

  it("menampilkan waktu tempuh lebih dulu, lalu jarak, atau tidak sama sekali", () => {
    expect(formatNearbyDistance(toNearby({ ...row, travel_minutes: 10 }))).toBe("10 menit");
    expect(formatNearbyDistance(toNearby(row))).toBe("2,5 km");
    expect(formatNearbyDistance(toNearby({ ...row, distance_km: null }))).toBeNull();
  });
});

describe("lowestPrice", () => {
  it("harga terendah yang boleh tampil", () => {
    const units = [
      toUnitType(unitRow({ price_from: 700000000 })),
      toUnitType(unitRow({ price_from: 571250000 })),
      toUnitType(unitRow({ show_price: false, price_from: 100 })),
    ];
    expect(lowestPrice(units)).toBe(571250000);
    expect(lowestPrice([])).toBeNull();
  });
});

describe("toUpdate", () => {
  const row: Tables["construction_updates"]["Row"] = {
    ...base,
    id: "c1",
    project_id: "p1",
    title: "Pengecoran",
    body: null,
    cover_path: "/c.webp",
    cover_alt: "Pengecoran blok A",
    photo_ids: [],
    source_report_id: null,
    content_status: "terbit",
    published_at: "2026-11-01T00:00:00Z",
  };

  it("memetakan progres terbit dengan sampul", () => {
    expect(toUpdate(row)).toMatchObject({
      title: "Pengecoran",
      cover: { alt: "Pengecoran blok A" },
    });
  });

  it("progres tanpa tanggal terbit dilewati", () => {
    expect(toUpdate({ ...row, published_at: null })).toBeNull();
  });
});
