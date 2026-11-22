export interface ScheduleRule {
  scope: "perusahaan" | "lokasi" | "karyawan" | "role";
  userId: string | null;
  role: string | null;
  workdays: number[];
}

export interface SchedulePerson {
  id: string;
  roles: { role: string; isPrimary: boolean }[];
}

const DEFAULT_WORKDAYS = [1, 2, 3, 4, 5, 6];

export function workdaysFor(person: SchedulePerson, rules: readonly ScheduleRule[]): number[] {
  const own = rules.find((rule) => rule.scope === "karyawan" && rule.userId === person.id);
  if (own) return own.workdays;
  const roles = [...person.roles].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  for (const { role } of roles) {
    const byRole = rules.find((rule) => rule.scope === "role" && rule.role === role);
    if (byRole) return byRole.workdays;
  }
  return rules.find((rule) => rule.scope === "perusahaan")?.workdays ?? DEFAULT_WORKDAYS;
}
