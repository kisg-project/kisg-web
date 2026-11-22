"use server";

import { ActionError, authActionClient } from "@/lib/safe-action";
import { shortcutPrefsSchema } from "./schemas";

export const saveShortcutsAction = authActionClient
  .inputSchema(shortcutPrefsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase.auth.updateUser({
      data: { portal_shortcuts: parsedInput },
    });
    if (error) throw new ActionError("Shortcut gagal disimpan. Coba lagi sebentar lagi.");
    return { saved: true };
  });
