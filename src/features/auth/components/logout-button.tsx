import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Form POST biasa ke /portal/auth/keluar: sesi diakhiri di server lalu halaman masuk dimuat penuh,
 * sehingga cache router tidak menyimpan halaman portal untuk tombol back. POST (bukan tautan) supaya
 * situs lain tidak bisa mengeluarkan user, karena cookie SameSite=Lax tidak ikut di POST lintas situs.
 */
export function LogoutButton({
  action = "/portal/auth/keluar",
  iconOnly = false,
}: {
  action?: string;
  /** Hanya ikon (header portal). Nama tombol tetap "Keluar" untuk pembaca layar. */
  iconOnly?: boolean;
}) {
  return (
    <form action={action} method="post">
      {iconOnly ? (
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Keluar"
          title="Keluar"
          className="text-subtle-foreground hover:bg-danger-50 hover:text-danger-700"
        >
          <LogOut aria-hidden="true" className="size-5" />
        </Button>
      ) : (
        <Button type="submit" variant="ghost">
          <LogOut aria-hidden="true" />
          Keluar
        </Button>
      )}
    </form>
  );
}
