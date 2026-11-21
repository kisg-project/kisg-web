import { defineConfig, devices } from "@playwright/test";

// E2E hanya jalan di CI (CLAUDE.md bagian 5): production build (`next build` sebelumnya, lalu `next start`).
// Tanpa retry: test flaky dicari penyebabnya, tidak ditutupi.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isCI = Boolean(process.env.CI);

// Kamera palsu Chromium untuk alur absensi (pola uji bawaan Chromium, tanpa dialog izin).
const FAKE_CAMERA = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  workers: isCI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [["github"], ["html", { open: "never" }], ["blob"]]
    : [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    // Header tambahan, misal bypass proteksi Vercel Preview (diisi preview.yml).
    extraHTTPHeaders: process.env.E2E_EXTRA_HEADERS
      ? (JSON.parse(process.env.E2E_EXTRA_HEADERS) as Record<string, string>)
      : undefined,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: { args: FAKE_CAMERA } },
    },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], launchOptions: { args: FAKE_CAMERA } } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
  // E2E_BASE_URL diisi saat menguji URL preview Vercel. Server lokal tidak dijalankan.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Hostname eksplisit: tanpa ini request.url di route handler memakai localhost, berbeda dari
        // baseURL 127.0.0.1, sehingga cookie sesi hilang setelah redirect.
        command: `pnpm start --hostname 127.0.0.1 --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        env: { ENABLE_DEV_UI: "1" },
      },
});
