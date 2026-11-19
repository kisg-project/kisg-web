#!/usr/bin/env node
// Pemeriksaan lokal untuk semua ukuran tugas (CLAUDE.md bagian 5):
// typecheck, lint, check:copy, lalu unit test yang terkait file yang berubah.
// Tidak menjalankan next build, Playwright, atau Supabase (hanya di CI).

import { spawnSync } from "node:child_process";

/** @param {string} label @param {string} command */
function run(label, command) {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`\nverify:quick GAGAL di langkah: ${label}`);
    process.exit(result.status ?? 1);
  }
}

/** @param {string} command @returns {string[]} */
function gitLines(command) {
  const result = spawnSync(command, { encoding: "utf8", shell: true });
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

run("typecheck", "pnpm typecheck");
run("lint", "pnpm lint");
run("check:copy", "pnpm check:copy");

const base = "origin/main";
const changed = new Set([
  ...gitLines(`git diff --name-only --diff-filter=ACMR ${base}...HEAD`),
  ...gitLines("git diff --name-only --diff-filter=ACMR HEAD"),
  ...gitLines("git ls-files --others --exclude-standard"),
]);
const testable = [...changed].filter(
  (file) => /\.(ts|tsx|mjs)$/.test(file) && !file.startsWith("e2e/"),
);

if (testable.length === 0) {
  console.log("\n> unit test terkait: tidak ada file kode yang berubah");
} else {
  run(
    "unit test terkait",
    `pnpm exec vitest related --run --passWithNoTests ${testable.map((f) => `"${f}"`).join(" ")}`,
  );
}

console.log("\nverify:quick lolos.");
