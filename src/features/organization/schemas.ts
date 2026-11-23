import { z } from "zod";

export const assignHolderSchema = z.object({
  positionId: z.uuid(),
  userId: z.uuid("Pilih karyawan."),
});
export type AssignHolderInput = z.input<typeof assignHolderSchema>;

export const endHolderSchema = z.object({ holderId: z.uuid() });

export const delegateSchema = z.object({
  positionId: z.uuid(),
  delegateToId: z.union([z.uuid(), z.literal("atasan")], "Pilih penerima pelimpahan."),
});
export type DelegateInput = z.input<typeof delegateSchema>;
