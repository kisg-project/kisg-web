import { z } from "zod";
import { INVITABLE_ROLES, type InvitableRole } from "@/config/roles";

const role = z.enum(INVITABLE_ROLES as [InvitableRole, ...InvitableRole[]], {
  error: "Pilih role.",
});

/** Multi role: minimal satu role, dan role utama harus salah satu role yang dipilih. */
const rolesFields = {
  roles: z
    .array(role, { error: "Pilih minimal satu role." })
    .min(1, "Pilih minimal satu role.")
    .refine((items) => new Set(items).size === items.length, "Role tidak boleh dobel."),
  primaryRole: role,
};

function primaryIncluded(value: { roles: string[]; primaryRole: string }) {
  return value.roles.includes(value.primaryRole);
}
const primaryIssue = {
  message: "Role utama harus termasuk role yang dipilih.",
  path: ["primaryRole"],
};

export const inviteUserSchema = z
  .object({
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
    ...rolesFields,
  })
  .refine(primaryIncluded, primaryIssue);

export const setUserRolesSchema = z
  .object({ userId: z.uuid(), ...rolesFields })
  .refine(primaryIncluded, primaryIssue);

export const setUserActiveSchema = z.object({ userId: z.uuid(), active: z.boolean() });
export const pendingInviteSchema = z.object({ userId: z.uuid() });

export type InviteUserInput = z.input<typeof inviteUserSchema>;
export type SetUserRolesInput = z.input<typeof setUserRolesSchema>;
