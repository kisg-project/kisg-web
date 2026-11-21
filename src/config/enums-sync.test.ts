import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPROVAL_DECISIONS, APPROVAL_DOC_TYPES } from "./approvals";
import { ATTENDANCE_ROLES, WORK_REPORT_LABEL } from "./attendance";
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
  const created = [...match[1].matchAll(/'([^']+)'/g)].map((value) => value[1] ?? "");
  // Nilai yang ditambah di migrasi berikutnya (alter type ... add value), sesuai urutan migrasi.
  const added = [
    ...sql.matchAll(
      new RegExp(`alter type public\.${name} add value (?:if not exists )?'([^']+)'`, "gi"),
    ),
  ].map((value) => value[1] ?? "");
  return [...created, ...added];
}

describe("enum Postgres sama dengan src/config", () => {
  it("app_role", () => {
    expect(enumValues("app_role")).toEqual([...APP_ROLES]);
  });

  it("unit_status", () => {
    expect(enumValues("unit_status")).toEqual([...UNIT_STATUSES]);
  });

  it("work_report_kind", () => {
    expect(enumValues("work_report_kind")).toEqual(Object.keys(WORK_REPORT_LABEL));
  });

  it("role wajib absensi sama dengan private.must_attend", () => {
    const match = /function private\.must_attend\(\)[\s\S]*?has_role\(([^)]*)\)/.exec(sql);
    const roles = [...(match?.[1] ?? "").matchAll(/'([^']+)'/g)].map((value) => value[1]);
    expect(roles).toEqual([...ATTENDANCE_ROLES]);
  });

  it("approval_decision dan approval_doc_type", () => {
    expect(enumValues("approval_decision")).toEqual([...APPROVAL_DECISIONS]);
    expect(enumValues("approval_doc_type")).toEqual([...APPROVAL_DOC_TYPES]);
  });
});
