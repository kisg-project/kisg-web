import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { requirePortalUser } from "@/features/auth";
import { AccountList, InviteForm, listPortalAccounts } from "@/features/users";

export const metadata: Metadata = { title: "Karyawan" };

export default async function EmployeesPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  const accounts = await listPortalAccounts();
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Karyawan"
        description="Undang karyawan lewat email, atur role dan rangkap jabatan, nonaktifkan akun yang tidak dipakai."
      />
      <section aria-labelledby="undang-judul" className="app-card p-5 sm:p-6">
        <h2 id="undang-judul" className="mb-4 text-lg font-bold">
          Undang karyawan
        </h2>
        <InviteForm allowOwner={user.roles.includes("owner")} />
      </section>
      <section aria-labelledby="daftar-judul" className="grid gap-3">
        <h2 id="daftar-judul" className="text-lg font-bold">
          Semua karyawan
        </h2>
        {accounts.length === 0 ? (
          <EmptyState
            title="Belum ada karyawan."
            description="Undang karyawan lewat form di atas."
          />
        ) : (
          <AccountList accounts={accounts} actor={{ id: user.id, roles: user.roles }} />
        )}
      </section>
    </div>
  );
}
