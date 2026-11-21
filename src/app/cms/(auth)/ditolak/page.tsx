import type { Metadata } from "next";
import { LogoutButton } from "@/features/auth";

export const metadata: Metadata = { title: "Akses ditolak" };

/** Akun yang sedang masuk bukan akun CMS (misal owner atau karyawan). */
export default function CmsDeniedPage() {
  return (
    <>
      <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        Akun ini tidak bisa membuka panel CMS
      </h1>
      <p className="mt-3 text-subtle-foreground">
        Panel CMS memakai akun khusus pengelola konten. Keluar dulu, lalu masuk dengan akun CMS.
      </p>
      <div className="mt-6">
        <LogoutButton action="/cms/auth/keluar" />
      </div>
    </>
  );
}
