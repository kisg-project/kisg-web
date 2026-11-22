import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseShortcutPrefs, type ShortcutPrefs } from "./schemas";

export async function getShortcutPrefs(): Promise<ShortcutPrefs | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const metadata: Record<string, unknown> = data.user?.user_metadata ?? {};
  return parseShortcutPrefs(metadata.portal_shortcuts);
}
