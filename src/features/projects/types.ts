import type { Database } from "@/lib/supabase/database.types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export interface ProjectAddress {
  street: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
}

export interface ProjectImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface UnitType {
  id: string;
  slug: string;
  name: string;
  landArea: number;
  buildingArea: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  /** Null kalau harga belum ada atau disembunyikan admin ("Hubungi marketing"). */
  price: number | null;
  features: string[];
  priceIncludes: string[];
  priceExcludes: string[];
  /** Spesifikasi bangunan (pondasi, dinding, lantai, dan seterusnya) dari brosur resmi. */
  materials: { label: string; value: string }[];
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  distanceKm: number | null;
  travelMinutes: number | null;
}

export interface Facility {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface ConstructionUpdate {
  id: string;
  title: string;
  body: string | null;
  cover: { src: string; alt: string } | null;
  publishedAt: string;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  tagline: string | null;
  address: ProjectAddress;
  cover: ProjectImage | null;
  unitTypes: UnitType[];
}

export interface ProjectDetail extends ProjectSummary {
  description: string | null;
  lat: number | null;
  lng: number | null;
  gallery: ProjectImage[];
  nearby: NearbyPlace[];
  facilities: Facility[];
  faqs: Faq[];
  updates: ConstructionUpdate[];
}
