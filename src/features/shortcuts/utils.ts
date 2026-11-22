import type { ShortcutPrefs } from "./schemas";

export function arrangeShortcuts<T extends { href: string }>(
  features: readonly T[],
  prefs: ShortcutPrefs | null,
): { item: T; visible: boolean }[] {
  if (!prefs) return features.map((item) => ({ item, visible: true }));
  const byHref = new Map(features.map((item) => [item.href, item]));
  const hidden = new Set(prefs.hidden);
  const seen = new Set<string>();
  const ordered: { item: T; visible: boolean }[] = [];
  for (const href of prefs.order) {
    const item = byHref.get(href);
    if (!item || seen.has(href)) continue;
    seen.add(href);
    ordered.push({ item, visible: !hidden.has(href) });
  }
  for (const item of features) {
    if (seen.has(item.href)) continue;
    ordered.push({ item, visible: !hidden.has(item.href) });
  }
  return ordered;
}

export function visibleShortcuts<T extends { href: string }>(
  features: readonly T[],
  prefs: ShortcutPrefs | null,
): T[] {
  return arrangeShortcuts(features, prefs)
    .filter((entry) => entry.visible)
    .map((entry) => entry.item);
}
