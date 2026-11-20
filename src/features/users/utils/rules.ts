import type { AppRole } from "@/config/roles";

/**
 * Aturan pengelolaan akun (keputusan owner, Fase 2): owner dan admin boleh mengundang semua role,
 * termasuk owner. Tidak ada yang boleh mengubah role atau menonaktifkan akunnya sendiri. Akun owner
 * yang sudah ada hanya boleh diubah oleh owner. Mengembalikan pesan penolakan, atau null kalau boleh.
 */
export function manageProblem(input: {
  actorId: string;
  actorRole: AppRole;
  targetId: string;
  targetRole: AppRole | null;
  nextRole?: AppRole;
}): string | null {
  if (input.actorRole !== "owner" && input.actorRole !== "admin") {
    return "Anda tidak punya akses untuk mengelola akun.";
  }
  if (input.actorId === input.targetId) return "Role dan status akun sendiri tidak bisa diubah.";
  if (input.targetRole === "owner" && input.actorRole !== "owner") {
    return "Akun owner hanya bisa diubah oleh owner.";
  }
  return null;
}
