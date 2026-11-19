import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Modul "server-only" melempar error di luar React Server Components. Di unit test diganti modul kosong.
      "server-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    // Default node. Test komponen memakai docblock `// @vitest-environment jsdom`.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**",
        "src/features/*/utils/**",
        "src/features/*/schemas/**",
        "src/features/*/actions/**",
      ],
      exclude: [
        "**/*.test.*",
        "**/index.ts",
        // Bagian kompresi yang hanya jalan di browser (canvas, Web Worker).
        // Diuji E2E di e2e/site/image-compress.spec.ts, logikanya diuji unit di plan.test.ts.
        "src/lib/image/compress.ts",
        "src/lib/image/compress.worker.ts",
        "src/lib/image/encode.ts",
        // Pembuat PDF jsPDF (butuh DOM, FileReader, unduhan). Diuji E2E di e2e/site/simulasi-kpr.spec.ts.
        "src/features/kpr/utils/pdf.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      reporter: ["text-summary", "html", "lcov"],
    },
  },
});
