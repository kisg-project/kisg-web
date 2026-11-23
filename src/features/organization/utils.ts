import type { OrgCoverage, OrgPerson, OrgPosition } from "./types";

export function coverageFor(
  position: OrgPosition,
  positions: readonly OrgPosition[],
  owners: readonly OrgPerson[],
): OrgCoverage {
  if (position.holders.length > 0) {
    return { people: position.holders.map((holder) => holder.person), via: position };
  }
  const byId = new Map(positions.map((item) => [item.id, item]));
  const seen = new Set<string>([position.id]);
  let currentId = position.delegateToId ?? position.parentId;
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const current = byId.get(currentId);
    if (!current) break;
    if (current.holders.length > 0) {
      return { people: current.holders.map((holder) => holder.person), via: current };
    }
    currentId = current.delegateToId ?? current.parentId;
  }
  return { people: [...owners], via: null };
}

export function vacantCount(positions: readonly OrgPosition[]): number {
  return positions.filter((position) => position.holders.length === 0).length;
}

export function delegateOptions(
  position: OrgPosition,
  positions: readonly OrgPosition[],
): OrgPosition[] {
  return positions.filter((item) => item.id !== position.id && item.delegateToId !== position.id);
}

export const LEVEL_LABEL: Record<number, string> = {
  1: "Direktur Utama",
  2: "Direktur",
  3: "General manager",
  4: "Manajer",
  5: "Supervisor",
  6: "Staf",
};
