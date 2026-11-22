import { z } from "zod";

const href = z.string().trim().min(1).max(120);

export const shortcutPrefsSchema = z.object({
  order: z.array(href).max(60),
  hidden: z.array(href).max(60),
});

export type ShortcutPrefs = z.infer<typeof shortcutPrefsSchema>;

export function parseShortcutPrefs(value: unknown): ShortcutPrefs | null {
  const result = shortcutPrefsSchema.safeParse(value);
  return result.success ? result.data : null;
}
