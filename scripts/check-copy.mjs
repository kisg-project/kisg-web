#!/usr/bin/env node
// Memeriksa aturan copywriting CLAUDE.md bagian 7 di src/, supabase/seed.sql, dan content/.
// Exit 1 kalau ada temuan. Pengecualian per baris: komentar "check-copy: allow <alasan>".

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { findCopyIssues } from "./lib/copy-rules.mjs";

const ROOT = process.cwd();
const TARGETS = ["src", "content", join("supabase", "seed.sql")];
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".css",
  ".md",
  ".mdx",
  ".json",
  ".sql",
  ".html",
  ".txt",
  ".svg",
]);
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);

/** @param {string} path @returns {string[]} */
function collect(path) {
  if (!existsSync(path)) return [];
  const stats = statSync(path);
  if (stats.isFile()) return TEXT_EXTENSIONS.has(extname(path)) ? [path] : [];
  return readdirSync(path).flatMap((entry) =>
    entry === "node_modules" || entry.startsWith(".") ? [] : collect(join(path, entry)),
  );
}

const files = TARGETS.flatMap((target) => collect(join(ROOT, target)));
let total = 0;

for (const file of files) {
  const issues = findCopyIssues(readFileSync(file, "utf8"), {
    isCode: CODE_EXTENSIONS.has(extname(file)),
  });
  for (const issue of issues) {
    total += 1;
    console.log(
      `${relative(ROOT, file).replaceAll("\\", "/")}:${issue.line}:${issue.column} [${issue.rule}] ${issue.message}`,
    );
  }
}

if (total > 0) {
  console.log(`\ncheck:copy GAGAL: ${total} temuan di ${files.length} file.`);
  process.exit(1);
}
console.log(`check:copy bersih (${files.length} file).`);
