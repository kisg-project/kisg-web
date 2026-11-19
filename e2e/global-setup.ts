// Global setup E2E.
// Fase 2: kalau E2E_SUPABASE=1, reset dan seed Supabase lokal di runner CI, lalu siapkan storageState per role
// (owner, admin, marketing_manager, marketing, site_manager, site_supervisor, finance) di e2e/.auth/.
// Fase 1 belum memakai database, jadi setup ini belum melakukan apa pun.
export default function globalSetup(): void {
  if (process.env.E2E_SUPABASE === "1") {
    throw new Error("Setup Supabase E2E belum dibuat. Aktif mulai Fase 2.");
  }
}
