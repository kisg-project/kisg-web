import { AxeBuilder } from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { mockExternalServices, type ExternalCalls } from "./network";

interface Fixtures {
  /**
   * Error console yang memang diharapkan di test tertentu, misal respons 400 dari server saat file
   * ditolak (browser selalu mencatatnya). Diatur lewat test.use di describe yang bersangkutan.
   */
  allowedConsoleErrors: RegExp[];
  /** Error console dan pageerror yang terjadi selama test. Test gagal kalau tidak kosong. */
  consoleErrors: string[];
  /** Request ke layanan eksternal yang dicegat (Meta, Brevo, Turnstile). */
  externalCalls: ExternalCalls;
}

export const test = base.extend<Fixtures>({
  allowedConsoleErrors: [[], { option: true }],
  externalCalls: [
    async ({ page }, use) => {
      const calls = await mockExternalServices(page);
      await use(calls);
    },
    { auto: true },
  ],
  consoleErrors: [
    async ({ page, allowedConsoleErrors }, use) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (allowedConsoleErrors.some((pattern) => pattern.test(text))) return;
        errors.push(text);
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
  // Bagian Reveal yang belum di-scroll masih transparan dan tampak pucat bagi axe. Tampilkan semuanya
  // (keadaan yang dilihat pengunjung setelah scroll), lalu tunggu transisinya selesai.
  // Transisi dimatikan dulu supaya bagian itu langsung terlihat penuh, tanpa jeda sebelum transisi mulai.
  await page.addStyleTag({ content: ".reveal { transition: none !important; }" });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('[data-reveal="pending"]')) {
      element.dataset.reveal = "shown";
    }
  });
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".reveal")].every((element) =>
      element.getAnimations().every((animation) => animation.playState !== "running"),
    ),
  );
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
    const { overflow, offenders } = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth;
      const describe = (element: Element) =>
        `${element.tagName.toLowerCase()}.${[...element.classList].slice(0, 4).join(".")} "${element.textContent
          .trim()
          .slice(0, 30)}" (${Math.round(element.getBoundingClientRect().right)}px)`;
      // Elemen terdalam yang melewati lebar layar, tidak termasuk isi wadah scroll (tidak menggeser halaman).
      const insideScroller = (element: Element) => {
        for (let node = element.parentElement; node; node = node.parentElement) {
          const { overflowX } = getComputedStyle(node);
          if (["auto", "scroll", "hidden", "clip"].includes(overflowX) && node !== document.body)
            return true;
        }
        return false;
      };
      const wide = [...document.querySelectorAll("body *")].filter(
        (element) =>
          element.getBoundingClientRect().right > limit + 1 &&
          !insideScroller(element) &&
          ![...element.children].some((child) => child.getBoundingClientRect().right > limit + 1),
      );
      const label = (element: Element) =>
        `${getComputedStyle(element).position === "fixed" ? "[fixed] " : ""}${describe(element)}`;
      return {
        overflow: document.documentElement.scrollWidth - limit,
        offenders: wide.slice(0, 5).map(label),
      };
    });
    expect(
      overflow,
      `Scroll horizontal di lebar ${width}px. Elemen terlalu lebar: ${offenders.join(" | ")}`,
    ).toBeLessThanOrEqual(0);
    await expect(mainLocator, `Konten utama terlihat di lebar ${width}px`).toBeVisible();
  }
  if (original) await page.setViewportSize(original);
}

/** Field simulasi KPR readOnly sampai halaman siap (hydration). Tunggu sebelum mengisi atau memeriksa axe. */
export async function waitForKprReady(
  page: Page,
  kind: "konvensional" | "syariah" = "konvensional",
) {
  // Field readOnly sampai halaman siap. toBeEditable membaca atribut readonly langsung dari input.
  await expect(
    page.getByRole("group", { name: `Data KPR ${kind}` }).getByLabel("Harga rumah"),
  ).toBeEditable();
}

export async function expectNotFound(page: Page, consoleErrors: string[]) {
  await expect(
    page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  const others = consoleErrors.filter((message) => !message.includes("status of 404"));
  consoleErrors.splice(0, consoleErrors.length, ...others);
}
