import { createHash } from "node:crypto";
import path from "node:path";
import type { Page } from "@playwright/test";
import type { AppRole } from "../../src/config/roles";
import type { TestUser } from "../factories/users";
import { expect, test as base } from "./test";

// Playwright selalu dijalankan dari root repo (pnpm exec playwright test).
export const AUTH_DIR = path.join(process.cwd(), "e2e", ".auth");

/** storageState per role yang disiapkan global-setup.ts. */
export function storageStateFor(role: AppRole): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/**
 * Rate limit login dihitung per IP. Semua test datang dari 127.0.0.1, jadi setiap test memakai IP
 * tiruan sendiri lewat x-forwarded-for. Di Vercel header ini ditimpa server, tidak bisa dipalsukan.
 */
function fakeIp(seed: string): string {
  const bytes = createHash("sha256").update(seed).digest();
  return `10.${String(bytes[0] ?? 0)}.${String(bytes[1] ?? 0)}.${String(((bytes[2] ?? 0) % 254) + 1)}`;
}

export const test = base.extend<{ clientIp: string }>({
  // Parameter kedua sengaja tidak bernama `use` supaya tidak dikira React Hook oleh eslint.
  clientIp: async ({ browserName }, provide, testInfo) => {
    await provide(fakeIp(`${browserName}-${testInfo.testId}-${String(Date.now())}`));
  },
  extraHTTPHeaders: async ({ extraHTTPHeaders, clientIp }, provide) => {
    await provide({ ...extraHTTPHeaders, "x-forwarded-for": clientIp });
  },
});

export { expect };

/** Login lewat form, seperti pengguna. */
export async function loginViaForm(page: Page, user: Pick<TestUser, "email" | "password">) {
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
