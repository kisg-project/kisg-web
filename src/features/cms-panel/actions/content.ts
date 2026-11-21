"use server";

import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/config/cache-tags";
import { ActionError, cmsActionClient } from "@/lib/safe-action";
import type { Json } from "@/lib/supabase/database.types";

/** jsonb dari data yang sudah divalidasi zod. */
function asJson(value: unknown): NonNullable<Json> {
  return value as NonNullable<Json>;
}

/** String kosong dari form menjadi null di database. */
function orNull(value: string | null | undefined): string | null {
  return value ? value : null;
}
import { careerSchema, deleteSchema, postSchema } from "../schemas/content";

const UNIQUE_VIOLATION = "23505";

function saveError(error: { code?: string; message: string }, what: string): Error {
  return error.code === UNIQUE_VIOLATION
    ? new ActionError(`Slug sudah dipakai ${what} lain. Ganti slug lalu simpan lagi.`)
    : new Error(`Gagal menyimpan ${what}: ${error.message}`);
}

/**
 * Simpan berita (baru atau ubah). Tanggal terbit diisi saat pertama kali diterbitkan dan tidak berubah
 * saat diedit, supaya urutan berita stabil. Cache halaman publik diperbarui seketika (updateTag).
 */
export const savePostAction = cmsActionClient
  .inputSchema(postSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    let publishedAt: string | null = null;
    if (input.id) {
      const { data: existing } = await ctx.supabase
        .from("posts")
        .select("published_at")
        .eq("id", input.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!existing) throw new ActionError("Berita tidak ditemukan. Muat ulang halaman.");
      publishedAt = existing.published_at;
    }
    if (input.status === "terbit" && !publishedAt) publishedAt = new Date().toISOString();

    const values = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      cover_path: orNull(input.coverPath),
      cover_alt: input.coverPath ? orNull(input.coverAlt) : null,
      body: asJson(input.body),
      content_status: input.status,
      published_at: publishedAt,
    };
    const result = input.id
      ? await ctx.supabase.from("posts").update(values).eq("id", input.id).select("id").single()
      : await ctx.supabase
          .from("posts")
          .insert({ ...values, created_by: ctx.userId, author_id: null })
          .select("id")
          .single();
    if (result.error) throw saveError(result.error, "berita");
    updateTag(CACHE_TAGS.posts);
    return { id: result.data.id };
  });

/** Hapus berita (soft delete): hilang dari website, data tetap ada untuk audit. */
export const deletePostAction = cmsActionClient
  .inputSchema(deleteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsedInput.id);
    if (error) throw new Error(`Gagal menghapus berita: ${error.message}`);
    updateTag(CACHE_TAGS.posts);
    return { ok: true as const };
  });

/** Simpan lowongan (baru atau ubah) beserta jenjangnya. */
export const saveCareerAction = cmsActionClient
  .inputSchema(careerSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const values = {
      title: input.title,
      slug: input.slug,
      department: orNull(input.department),
      location: orNull(input.location),
      employment_type: orNull(input.employmentType),
      level: input.level,
      closes_on: orNull(input.closesOn),
      description: asJson(input.description),
      requirements: asJson(input.requirements),
      content_status: input.status,
    };
    const result = input.id
      ? await ctx.supabase.from("careers").update(values).eq("id", input.id).select("id").single()
      : await ctx.supabase
          .from("careers")
          .insert({ ...values, created_by: ctx.userId })
          .select("id")
          .single();
    if (result.error) throw saveError(result.error, "lowongan");
    updateTag(CACHE_TAGS.careers);
    return { id: result.data.id };
  });

export const deleteCareerAction = cmsActionClient
  .inputSchema(deleteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from("careers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsedInput.id);
    if (error) throw new Error(`Gagal menghapus lowongan: ${error.message}`);
    updateTag(CACHE_TAGS.careers);
    return { ok: true as const };
  });
