import { AxeBuilder } from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { mockExternalServices, type ExternalCalls } from "./network";

interface Fixtures {
  /** Error console dan pageerror yang terjadi selama test. Test gagal kalau tidak kosong. */
  consoleErrors: string[];
  /** Request ke layanan eksternal yang dicegat (Meta, Resend, Turnstile). */
  externalCalls: ExternalCalls;
}

export const test = base.extend<Fixtures>({
  externalCalls: [
    async ({ page }, use) => {
      const calls = await mockExternalServices(page);
      await use(calls);
    },
    { auto: true },
  ],
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });
      await use(errors);
      expect(errors, "Tidak boleh ada error console").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Pemeriksaan aksesibilitas WCAG 2.2 AA dengan axe. */
export async function expectNoA11yViolations(page: Page, options: { exclude?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const results = await builder.analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes
        .map(
          (node) =>
            `${node.target.join(" ")} :: ${(node.failureSummary ?? "").replace(/\s+/g, " ")}`,
        )
        .join(" | ")})`,
  );
  expect(summary, "Pelanggaran aksesibilitas").toEqual([]);
}

export const RESPONSIVE_WIDTHS = [320, 375, 768, 1024, 1440] as const;

/**
 * Responsif (CLAUDE.md bagian 6): di setiap lebar, tidak ada scroll horizontal dan elemen utama terlihat.
 * Viewport dikembalikan ke ukuran semula setelah selesai.
 */
export async function expectResponsive(page: Page, mainLocator = page.locator("main")) {
  const original = page.viewportSize();
  for (const width of RESPONSIVE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `Scroll horizontal di lebar ${width}px`).toBeLessThanOrEqual(0);
    await expect(mainLocator, `Konten utama terlihat di lebar ${width}px`).toBeVisible();
  }
  if (original) await page.setViewportSize(original);
}
