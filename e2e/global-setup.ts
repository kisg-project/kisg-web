import { mkdir, writeFile } from "node:fs/promises";
import type { FullConfig } from "@playwright/test";
import { APP_ROLES } from "../src/config/roles";
import { createPortalUser } from "./factories/users";
import { AUTH_DIR, storageStateFor } from "./fixtures/portal";
import { sessionCookies } from "./fixtures/supabase";

// Global setup E2E. Kalau E2E_SUPABASE=1 (CI, setelah `supabase start` di runner), siapkan satu akun
// per role dan simpan sesinya sebagai storageState di e2e/.auth/<role>.json.
// Database sudah bersih dan ter-seed karena Supabase lokal baru dijalankan di runner itu.
export default async function globalSetup(config: FullConfig): Promise<void> {
  if (process.env.E2E_SUPABASE !== "1") return;

  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error("baseURL Playwright belum diatur.");

  await mkdir(AUTH_DIR, { recursive: true });
  await Promise.all(
    APP_ROLES.map(async (role) => {
      const user = await createPortalUser({ role, prefix: `sesi-${role.replaceAll("_", "-")}` });
      const cookies = await sessionCookies(user.email, user.password, baseURL);
      await writeFile(storageStateFor(role), JSON.stringify({ cookies, origins: [] }));
    }),
  );
}
