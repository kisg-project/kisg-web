import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Form POST biasa ke /portal/auth/keluar: sesi diakhiri di server lalu halaman masuk dimuat penuh,
 * sehingga cache router tidak menyimpan halaman portal untuk tombol back. POST (bukan tautan) supaya
 * situs lain tidak bisa mengeluarkan user, karena cookie SameSite=Lax tidak ikut di POST lintas situs.
 */
export function LogoutButton({ action = "/portal/auth/keluar" }: { action?: string }) {
  return (
    <form action={action} method="post">
      <Button type="submit" variant="ghost">
        <LogOut aria-hidden="true" />
        Keluar
      </Button>
    </form>
  );
}
