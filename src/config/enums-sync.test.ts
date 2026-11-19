import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_ROLES } from "./roles";
import { UNIT_STATUSES } from "./units";

// Satu sumber kebenaran: enum Postgres harus sama dengan konstanta di src/config (CLAUDE.md bagian 4).
const migrationsDir = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
  .join("\n");

function enumValues(name: string): string[] {
  const match = new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`, "i").exec(sql);
  if (!match?.[1]) throw new Error(`Enum ${name} tidak ditemukan di migrasi.`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((value) => value[1] ?? "");
}

describe("enum Postgres sama dengan src/config", () => {
  it("app_role", () => {
    expect(enumValues("app_role")).toEqual([...APP_ROLES]);
  });

  it("unit_status", () => {
    expect(enumValues("unit_status")).toEqual([...UNIT_STATUSES]);
  });
});
