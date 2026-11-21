import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { requirePortalUser } from "@/features/auth";
import { AccountList, InviteDialog, listPortalAccounts } from "@/features/users";

export const metadata: Metadata = { title: "Karyawan" };

export default async function EmployeesPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  const accounts = await listPortalAccounts();
  return (
    <div className="grid gap-8">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke beranda"
        title="Karyawan"
        description="Undang karyawan lewat email, atur role dan rangkap jabatan, nonaktifkan akun yang tidak dipakai."
      />
      <div>
        <InviteDialog allowOwner={user.roles.includes("owner")} />
      </div>
      <section aria-labelledby="daftar-judul" className="grid gap-3">
        <h2 id="daftar-judul" className="text-lg font-bold">
          Semua karyawan
        </h2>
        {accounts.length === 0 ? (
          <EmptyState
            title="Belum ada karyawan"
            description="Undang karyawan dengan tombol Undang karyawan."
          />
        ) : (
          <AccountList accounts={accounts} actor={{ id: user.id, roles: user.roles }} />
        )}
      </section>
    </div>
  );
}
