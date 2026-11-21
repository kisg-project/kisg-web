import "server-only";
import type { CareerLevel } from "@/config/careers";
import type { ContentBlock } from "@/features/cms";
import { contentBlockSchema } from "@/features/cms/utils/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContentStatus = "draft" | "terbit";

function blocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = contentBlockSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function editableStatus(value: string): ContentStatus {
  return value === "terbit" ? "terbit" : "draft";
}

export interface CmsPostRow {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface CmsPost extends CmsPostRow {
  excerpt: string;
  coverPath: string | null;
  coverAlt: string | null;
  body: ContentBlock[];
}

export async function listCmsPosts(): Promise<CmsPostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, content_status, published_at, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat berita: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: editableStatus(row.content_status),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCmsPost(id: string): Promise<CmsPost | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    status: editableStatus(data.content_status),
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    excerpt: data.excerpt ?? "",
    coverPath: data.cover_path,
    coverAlt: data.cover_alt,
    body: blocks(data.body),
  };
}

export interface CmsCareerRow {
  id: string;
  title: string;
  slug: string;
  level: CareerLevel | null;
  status: ContentStatus;
  closesOn: string | null;
  updatedAt: string;
}

export interface CmsCareer extends CmsCareerRow {
  department: string | null;
  location: string | null;
  employmentType: string | null;
  description: ContentBlock[];
  requirements: string[];
}

export async function listCmsCareers(): Promise<CmsCareerRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("careers")
    .select("id, title, slug, level, content_status, closes_on, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat lowongan: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    level: row.level,
    status: editableStatus(row.content_status),
    closesOn: row.closes_on,
    updatedAt: row.updated_at,
  }));
}

export async function getCmsCareer(id: string): Promise<CmsCareer | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("careers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    level: data.level,
    status: editableStatus(data.content_status),
    closesOn: data.closes_on,
    updatedAt: data.updated_at,
    department: data.department,
    location: data.location,
    employmentType: data.employment_type,
    description: blocks(data.description),
    requirements: textList(data.requirements),
  };
}

export interface CmsSummary {
  posts: { published: number; drafts: number };
  careers: { published: number; drafts: number };
}

export async function getCmsSummary(): Promise<CmsSummary> {
  const [posts, careers] = await Promise.all([listCmsPosts(), listCmsCareers()]);
  const count = (rows: { status: ContentStatus }[], status: ContentStatus) =>
    rows.filter((row) => row.status === status).length;
  return {
    posts: { published: count(posts, "terbit"), drafts: count(posts, "draft") },
    careers: { published: count(careers, "terbit"), drafts: count(careers, "draft") },
  };
}
