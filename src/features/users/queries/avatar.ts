import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Umur signed URL foto profil (detik). Pendek karena bucket privat (CLAUDE.md bagian 8). */
const AVATAR_URL_TTL = 60 * 60;

/** Signed URL foto profil, dibaca dengan sesi pengguna (RLS: hanya staf aktif). */
export async function avatarUrls(paths: readonly (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from("avatars").createSignedUrls(unique, AVATAR_URL_TTL);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  return (await avatarUrls([path])).get(path) ?? null;
}
