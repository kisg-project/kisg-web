import "server-only";
import { isAppRole, type AppRole } from "@/config/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PortalAccount {
  id: string;
  email: string;
  fullName: string;
  role: AppRole | null;
  isActive: boolean;
  createdAt: string;
}

/** Semua akun portal untuk halaman admin. Dibaca dengan sesi admin, jadi tetap dibatasi RLS. */
export async function listPortalAccounts(): Promise<PortalAccount[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_active, created_at, user_roles(role)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat pengguna: ${error.message}`);
  return data.map((row) => {
    const role = row.user_roles?.role;
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: role && isAppRole(role) ? role : null,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  });
}
