import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { requirePortalUser } from "@/features/auth";
import { AccountDirectory, InviteDialog, listPortalAccounts } from "@/features/users";

export const metadata: Metadata = { title: "Karyawan" };

export default async function EmployeesPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  const accounts = await listPortalAccounts();
  return (
    <div className="tone-violet grid gap-4">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke beranda"
        title="Karyawan"
        description={`${String(accounts.length)} akun`}
        actions={<InviteDialog allowOwner={user.roles.includes("owner")} />}
      />
      <section aria-labelledby="daftar-judul" className="grid gap-3">
        <h2 id="daftar-judul" className="sr-only">
          Semua karyawan
        </h2>
        <AccountDirectory accounts={accounts} actor={{ id: user.id, roles: user.roles }} />
      </section>
    </div>
  );
}
