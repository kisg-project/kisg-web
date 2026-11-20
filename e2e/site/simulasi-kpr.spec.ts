import { readFile } from "node:fs/promises";
import {
  expect,
  expectNoA11yViolations,
  expectResponsive,
  test,
  waitForKprReady,
} from "../fixtures/test";

// Nilai acuan dihitung terpisah (Python, rumus anuitas). Harga Rp 571.250.000, uang muka 10%, 15 tahun.

test.describe("Halaman simulasi KPR", () => {
  test("konvensional: produk pertama terpilih dan angsuran sesuai nilai acuan", async ({
    page,
  }) => {
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    const panel = page.getByRole("tabpanel", { name: "KPR Konvensional" });
    await expect(panel.getByRole("combobox", { name: "Program KPR" })).toHaveText(
      "Mandiri KPR Bunga Spesial Fixed 3 Tahun",
    );
    await expect(panel.getByLabel("Harga rumah")).toHaveValue("571.250.000");
    await expect(panel.getByLabel("Uang muka (rupiah)")).toHaveValue("57.125.000");
    await expect(panel.getByText("Rp 3.491.410").first()).toBeVisible();
    await expect(panel.getByText("Bunga floating setelah masa fixed (asumsi)")).toBeVisible();
  });

  test("tombol pada kartu produk mengisi form dengan produk itu", async ({ page }) => {
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    const panel = page.getByRole("tabpanel", { name: "KPR Konvensional" });
    const card = panel.getByRole("listitem").filter({ hasText: "KPR BTN Fixed 3 Tahun" });
    await card.getByRole("button", { name: "Hitung cicilan" }).click();
    await expect(card.getByRole("button", { name: "Hitung cicilan" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(panel.getByRole("combobox", { name: "Program KPR" })).toHaveText(
      "KPR BTN Fixed 3 Tahun",
    );
    await expect(panel.getByText("Rp 3.464.551").first()).toBeVisible();
  });

  test("dropdown program memakai komponen custom dan bisa dipilih dengan keyboard", async ({
    page,
  }) => {
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    const panel = page.getByRole("tabpanel", { name: "KPR Konvensional" });
    const program = panel.getByRole("combobox", { name: "Program KPR" });
    await program.click();
    await page.getByRole("option", { name: "KPR BTN Fixed 3 Tahun" }).click();
    await expect(program).toHaveText("KPR BTN Fixed 3 Tahun");
    await expect(panel.getByText("Rp 3.464.551").first()).toBeVisible();
    await program.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("option", { name: "Atur sendiri" }).click();
    await expect(program).toHaveText("Atur sendiri");
  });

  test("input nominal bertitik otomatis dan persen memakai koma", async ({ page }) => {
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    const panel = page.getByRole("tabpanel", { name: "KPR Konvensional" });
    const dp = panel.getByLabel("Uang muka (rupiah)");
    await dp.fill("");
    await dp.pressSequentially("100000000");
    await expect(dp).toHaveValue("100.000.000");
    await expect(panel.getByLabel("Uang muka (persen)")).toHaveValue("17,5");
    await expect(panel.getByText("Rp 3.200.247").first()).toBeVisible();

    const rate = panel.getByLabel("Periode 1: Bunga");
    await rate.fill("");
    await rate.pressSequentially("7.5");
    await expect(rate).toHaveValue("7,5");
  });

  test("periode bisa ditambah dan dihapus, total periode melebihi jangka waktu ditolak", async ({
    page,
  }) => {
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    const panel = page.getByRole("tabpanel", { name: "KPR Konvensional" });
    await panel.getByRole("button", { name: "Tambah periode" }).click();
    await expect(panel.getByLabel("Periode 2: Bunga")).toBeVisible();
    const years = panel.getByLabel("Lama").nth(1);
    await years.fill("20");
    await expect(
      panel.getByText("Total periode tetap tidak boleh lebih lama dari jangka waktu."),
    ).toBeVisible();
    await expect(panel.getByText("Lengkapi data di form untuk melihat hasil.")).toBeVisible();
    await panel.getByRole("button", { name: "Hapus periode 2" }).click();
    await expect(panel.getByText("Rp 3.491.410").first()).toBeVisible();
  });

  test("syariah: istilah syariah tanpa kata bunga, cicilan, atau pinjaman", async ({ page }) => {
    await page.goto("/simulasi-kpr");
    await page.getByRole("tab", { name: "KPR Syariah" }).click();
    await waitForKprReady(page, "syariah");
    const panel = page.getByRole("tabpanel", { name: "KPR Syariah" });
    await expect(panel.getByRole("combobox", { name: "Program pembiayaan" })).toHaveText(
      "BSI KPR Sejahtera",
    );
    await expect(panel.getByText("Rp 4.065.668").first()).toBeVisible();
    await expect(panel.getByText("Harga jual bank (pokok + margin)")).toBeVisible();
    await expect(panel.getByText("Margin tetap sampai lunas").first()).toBeVisible();
    const text = (await panel.textContent()) ?? "";
    expect(text).not.toMatch(/\b(bunga|cicilan|pinjaman)\b/i);
  });

  test("unduh PDF berkop KIS dengan nomor halaman", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    const panel = page.getByRole("tabpanel", { name: "KPR Konvensional" });
    const downloadPromise = page.waitForEvent("download");
    await panel.getByRole("button", { name: "Unduh PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      "simulasi-kpr-konvensional-sejahtera-green-village.pdf",
    );
    const path = await download.path();
    const content = (await readFile(path)).toString("latin1");
    expect(content.startsWith("%PDF")).toBe(true);
    expect(content).toContain("PT Kreatif Inovatif Sejahtera Group");
    expect(content).toContain("Simulasi KPR Konvensional");
    expect(content).toContain("Halaman 1 dari");
    expect(content).toContain("Rp 3.491.410");
  });

  test("lolos aksesibilitas, responsif, dan metadata halaman", async ({ page }) => {
    await page.goto("/simulasi-kpr");
    await waitForKprReady(page);
    await expect(page).toHaveTitle(/Simulasi KPR/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "").pathname).toBe("/simulasi-kpr");
    await expect(page.getByRole("heading", { name: "Akad dalam KPR syariah" })).toBeVisible();
    await expectNoA11yViolations(page);
    await expectResponsive(page);
  });
});
