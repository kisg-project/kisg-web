import { z } from "zod";
import { APP_ROLES } from "@/config/roles";

const role = z.enum(APP_ROLES, { error: "Pilih role." });

export const inviteUserSchema = z.object({
  fullName: z
    .string({ error: "Isi nama lengkap." })
    .trim()
    .min(2, "Isi nama lengkap, minimal 2 huruf.")
    .max(80, "Nama maksimal 80 karakter."),
  email: z
    .string({ error: "Isi email." })
    .trim()
    .toLowerCase()
    .min(1, "Isi email.")
    .max(254, "Email terlalu panjang.")
    .pipe(z.email("Format email tidak valid. Contoh: nama@kisgroup.co.id.")),
  role,
});

export const setUserRoleSchema = z.object({ userId: z.uuid(), role });
export const setUserActiveSchema = z.object({ userId: z.uuid(), active: z.boolean() });

export type InviteUserInput = z.input<typeof inviteUserSchema>;
