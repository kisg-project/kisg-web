import "server-only";
import { isAppRole } from "@/config/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrgChart, OrgPerson, OrgPosition } from "./types";

export async function getOrgChart(): Promise<OrgChart> {
  const admin = createSupabaseAdminClient();
  const [departments, positions, holders, roles, profiles] = await Promise.all([
    admin.from("departments").select("id, name").is("deleted_at", null).order("sort_order"),
    admin
      .from("positions")
      .select(
        "id, code, title, department_id, level, parent_id, delegate_to_id, default_role, sort_order",
      )
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("sort_order"),
    admin
      .from("position_holders")
      .select("id, position_id, user_id, started_at")
      .is("ended_at", null),
    admin.from("user_roles").select("user_id, role"),
    admin.from("profiles").select("id, full_name, is_active, deleted_at"),
  ]);
  if (positions.error)
    throw new Error(`Struktur organisasi gagal dimuat: ${positions.error.message}`);

  const activePeople = new Map<string, OrgPerson>();
  for (const profile of profiles.data ?? []) {
    if (profile.is_active && !profile.deleted_at) {
      activePeople.set(profile.id, { id: profile.id, name: profile.full_name || "Tanpa nama" });
    }
  }
  const roleRows = roles.data ?? [];
  const cmsOnly = new Set(
    roleRows
      .filter((row) => row.role === "cms")
      .map((row) => row.user_id)
      .filter((id) => !roleRows.some((row) => row.user_id === id && row.role !== "cms")),
  );
  const owners = [
    ...new Set(roleRows.filter((row) => row.role === "owner").map((row) => row.user_id)),
  ]
    .map((id) => activePeople.get(id))
    .filter((person): person is OrgPerson => Boolean(person));
  const employees = [...activePeople.values()]
    .filter(
      (person) => roleRows.some((row) => row.user_id === person.id) && !cmsOnly.has(person.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const list: OrgPosition[] = positions.data
    .filter((row) => isAppRole(row.default_role))
    .map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      departmentId: row.department_id,
      level: row.level,
      parentId: row.parent_id,
      delegateToId: row.delegate_to_id,
      defaultRole: row.default_role,
      holders: (holders.data ?? [])
        .filter((holder) => holder.position_id === row.id && activePeople.has(holder.user_id))
        .map((holder) => ({
          id: holder.id,
          startedAt: holder.started_at,
          person: activePeople.get(holder.user_id) ?? { id: holder.user_id, name: "Tanpa nama" },
        })),
    }));

  return {
    departments: (departments.data ?? []).map((row) => ({ id: row.id, name: row.name })),
    positions: list,
    owners,
    employees,
  };
}
