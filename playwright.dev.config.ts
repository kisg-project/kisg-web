import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Iterasi cepat dengan dev server. Tidak dipakai di laptop pengembang (RAM 4 GB, CLAUDE.md bagian 5),
// disediakan untuk mesin yang mampu. Suite resmi tetap playwright.config.ts di CI.
export default defineConfig({
  ...base,
  webServer: {
    command: "pnpm dev --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
