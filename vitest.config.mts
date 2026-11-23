import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
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
        "src/lib/image/compress.ts",
        "src/lib/image/compress.worker.ts",
        "src/lib/image/encode.ts",
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
