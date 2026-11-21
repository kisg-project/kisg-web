import type { AppRole } from "@/config/roles";

/**
 * Aturan pengelolaan akun. Owner (dan akun admin lama) boleh mengundang dan mengubah akun. Tidak ada
 * yang boleh mengubah role atau menonaktifkan akunnya sendiri. Role owner hanya bisa diberikan,
 * dicabut, atau diubah oleh owner (juga dipaksa di public.set_user_roles). Mengembalikan pesan
 * penolakan, atau null kalau boleh.
 */
export function manageProblem(input: {
  actorId: string;
  actorRoles: readonly AppRole[];
  targetId: string;
  targetRoles: readonly AppRole[];
  nextRoles?: readonly AppRole[];
}): string | null {
  const actorIsOwner = input.actorRoles.includes("owner");
  if (!actorIsOwner && !input.actorRoles.includes("admin")) {
    return "Anda tidak punya akses untuk mengelola akun.";
  }
  if (input.actorId === input.targetId) return "Role dan status akun sendiri tidak bisa diubah.";
  const touchesOwner = input.targetRoles.includes("owner") || input.nextRoles?.includes("owner");
  if (touchesOwner && !actorIsOwner) return "Akun owner hanya bisa diubah oleh owner.";
  return null;
}
