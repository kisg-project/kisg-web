import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPROVAL_DECISIONS, APPROVAL_DOC_TYPES } from "./approvals";
import { ATTENDANCE_ROLES, WORK_REPORT_LABEL } from "./attendance";
import { LEAD_ACTIVITY_TYPES, LEAD_ASSIGNMENT_REASONS, LEAD_SOURCES, LEAD_STAGES } from "./crm";
import { APP_ROLES } from "./roles";
import { UNIT_STATUSES } from "./units";

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

  it("enum CRM", () => {
    expect(enumValues("lead_stage")).toEqual([...LEAD_STAGES]);
    expect(enumValues("lead_source_kind")).toEqual([...LEAD_SOURCES]);
    expect(enumValues("lead_activity_type")).toEqual([...LEAD_ACTIVITY_TYPES]);
    expect(enumValues("lead_assignment_reason")).toEqual([...LEAD_ASSIGNMENT_REASONS]);
  });
});
