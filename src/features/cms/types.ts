export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  alt: string;
  cta: { label: string; href: string } | null;
}

/** Blok isi konten (berita, promo, lowongan). Dirender sebagai elemen React, tanpa HTML mentah. */
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export interface ContentImage {
  src: string;
  alt: string;
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover: ContentImage | null;
  publishedAt: string;
}

export interface Post extends PostSummary {
  body: ContentBlock[];
}

export interface PromoSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover: ContentImage | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface Promo extends PromoSummary {
  body: ContentBlock[];
  terms: string | null;
}

export interface CareerSummary {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  closesOn: string | null;
}

export interface Career extends CareerSummary {
  description: ContentBlock[];
  requirements: string[];
}
