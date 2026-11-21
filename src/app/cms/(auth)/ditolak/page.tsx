import type { Metadata } from "next";
import { LogoutButton } from "@/features/auth";

export const metadata: Metadata = { title: "Akses ditolak" };

/** Akun yang sedang masuk bukan akun CMS (misal owner atau karyawan). */
export default function CmsDeniedPage() {
  return (
    <>
      <h1 className="text-xl font-bold">Akun ini tidak bisa membuka panel CMS</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Panel CMS memakai akun khusus pengelola konten. Keluar dulu, lalu masuk dengan akun CMS.
      </p>
      <div className="mt-6">
        <LogoutButton action="/cms/auth/keluar" />
      </div>
    </>
  );
}
