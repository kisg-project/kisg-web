import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import type {
  ConstructionUpdate,
  Facility,
  Faq,
  NearbyPlace,
  ProjectAddress,
  ProjectImage,
  UnitType,
} from "../types";

type Tables = Database["public"]["Tables"];
type ProjectRow = Tables["projects"]["Row"];
type UnitTypeRow = Tables["unit_types"]["Row"];
type MediaRow = Tables["project_media"]["Row"];

const stringList = z.array(z.string().trim().min(1)).catch([]);

/** Isi kolom unit_types.specs. Nilai yang tidak sesuai skema diabaikan, bukan merusak halaman. */
const unitSpecsSchema = z
  .object({
    features: stringList.optional(),
    price_includes: stringList.optional(),
    price_excludes: stringList.optional(),
    materials: z
      .array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) }))
      .catch([])
      .optional(),
  })
  .catch({});

export function toAddress(
  row: Pick<ProjectRow, "address" | "village" | "district" | "city" | "province" | "postal_code">,
): ProjectAddress {
  return {
    street: row.address,
    village: row.village,
    district: row.district,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
  };
}

/** Alamat proyek dalam satu baris. Bagian yang kosong dilewati. */
export function formatAddress(address: ProjectAddress): string {
  const tail = [address.province, address.postalCode].filter(Boolean).join(" ");
  return [address.street, address.village, address.district, address.city, tail]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/** Nama kecamatan tanpa awalan "Kec." untuk teks singkat, misal "Tambun Selatan". */
export function shortArea(address: ProjectAddress): string | null {
  return address.district?.replace(/^Kec(amatan)?\.?\s*/i, "") ?? null;
}

export function toUnitType(row: UnitTypeRow): UnitType {
  const specs = unitSpecsSchema.parse(row.specs);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    landArea: row.land_area,
    buildingArea: row.building_area,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floors: row.floors,
    price: row.show_price ? row.price_from : null,
    features: specs.features ?? [],
    materials: specs.materials ?? [],
    priceIncludes: specs.price_includes ?? [],
    priceExcludes: specs.price_excludes ?? [],
  };
}

/** Foto tanpa ukuran tidak bisa dipakai next/image dengan aman, jadi dilewati. */
export function toImage(row: MediaRow): ProjectImage | null {
  if (!row.width || !row.height) return null;
  return { id: row.id, src: row.path, alt: row.alt, width: row.width, height: row.height };
}

export function toImages(rows: MediaRow[]): ProjectImage[] {
  return rows
    .filter((row) => row.kind === "foto")
    .toSorted((a, b) => a.sort_order - b.sort_order)
    .map(toImage)
    .filter((image): image is ProjectImage => image !== null);
}

export function toNearby(row: Tables["nearby_places"]["Row"]): NearbyPlace {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    distanceKm: row.distance_km,
    travelMinutes: row.travel_minutes,
  };
}

export function toFacility(row: Tables["facilities"]["Row"]): Facility {
  return { id: row.id, name: row.name, icon: row.icon, description: row.description };
}

export function toFaq(row: Tables["faqs"]["Row"]): Faq {
  return { id: row.id, question: row.question, answer: row.answer };
}

export function toUpdate(row: Tables["construction_updates"]["Row"]): ConstructionUpdate | null {
  if (!row.published_at) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    cover: row.cover_path && row.cover_alt ? { src: row.cover_path, alt: row.cover_alt } : null,
    publishedAt: row.published_at,
  };
}

/** Harga terendah yang boleh ditampilkan dari daftar tipe unit, atau null. */
export function lowestPrice(unitTypes: readonly UnitType[]): number | null {
  const prices = unitTypes
    .map((unit) => unit.price)
    .filter((price): price is number => price !== null);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/** Jarak atau waktu tempuh untuk ditampilkan, atau null kalau belum ada data. */
export function formatNearbyDistance(
  place: Pick<NearbyPlace, "distanceKm" | "travelMinutes">,
): string | null {
  if (place.travelMinutes !== null) return `${String(place.travelMinutes)} menit`;
  if (place.distanceKm !== null) {
    return `${place.distanceKm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
  }
  return null;
}
