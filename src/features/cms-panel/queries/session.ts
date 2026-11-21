import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { loadAccountRoles } from "@/lib/auth/account-roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CmsUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Wajib akun khusus CMS. Belum login: ke halaman masuk CMS. Akun lain (owner, karyawan): ke halaman
 * ditolak. Role dibaca dari database supaya perubahan langsung berlaku. Di-cache per request.
 */
export const requireCmsUser = cache(async (): Promise<CmsUser> => {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/cms/login");
  const { roles, profile } = await loadAccountRoles(supabase, userId);
  if (!profile || !roles.includes("cms")) redirect("/cms/ditolak");
  return { id: userId, email: profile.email, fullName: profile.fullName };
});
