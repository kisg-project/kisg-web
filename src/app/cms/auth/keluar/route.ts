import { relativeRedirect } from "@/lib/http/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Tombol Keluar di panel CMS (form POST). 303: browser membuka halaman masuk dengan GET. */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return relativeRedirect("/cms/login", 303);
}
