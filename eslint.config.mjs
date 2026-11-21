import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const FORBIDDEN_ICON_MESSAGE =
  "Ikon sparkles, wand, stars, dan bot dilarang (CLAUDE.md bagian 3). Pilih ikon lain.";

export default defineConfig([
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          minimumDescriptionLength: 10,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "eslint-comments/require-description": "off",
      // Dropdown wajib komponen custom (src/components/ui/select.tsx) supaya seragam di semua browser
      // (keputusan owner, Fase 3). Elemen select bawaan browser tidak dipakai.
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='select']",
          message:
            "Pakai komponen Select dari @/components/ui/select, bukan select bawaan browser.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              importNames: [
                "Sparkles",
                "Sparkle",
                "SparklesIcon",
                "SparkleIcon",
                "WandSparkles",
                "WandSparklesIcon",
                "Wand",
                "Wand2",
                "WandIcon",
                "Stars",
                "Bot",
                "BotIcon",
                "BotMessageSquare",
                "BotOff",
              ],
              message: FORBIDDEN_ICON_MESSAGE,
            },
          ],
          patterns: [
            {
              group: [
                "lucide-react/icons/sparkle*",
                "lucide-react/icons/wand*",
                "lucide-react/icons/stars",
                "lucide-react/icons/bot*",
              ],
              message: FORBIDDEN_ICON_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  {
    // Skrip Node dan file konfigurasi JS tidak ikut type-check.
    files: ["**/*.mjs", "**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    // Aset statis, termasuk WASM MediaPipe hasil salinan scripts/copy-mediapipe.mjs.
    "public/**",
    // Hasil generate Supabase CLI, diperiksa sama persis oleh db.yml.
    "src/lib/supabase/database.types.ts",
  ]),
]);
