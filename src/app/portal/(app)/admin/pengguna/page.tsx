import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { requirePortalUser } from "@/features/auth";
import { AccountList, InviteForm, listPortalAccounts } from "@/features/users";

export const metadata: Metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  const accounts = await listPortalAccounts();
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Pengguna"
        description="Undang karyawan, atur role, dan nonaktifkan akun yang tidak dipakai."
      />
      <section aria-labelledby="undang-judul" className="rounded-lg border bg-card p-5 sm:p-6">
        <h2 id="undang-judul" className="mb-4 text-lg font-bold">
          Undang pengguna
        </h2>
        <InviteForm />
      </section>
      <section aria-labelledby="daftar-judul" className="grid gap-3">
        <h2 id="daftar-judul" className="text-lg font-bold">
          Semua pengguna
        </h2>
        {accounts.length === 0 ? (
          <EmptyState
            title="Belum ada pengguna."
            description="Undang karyawan lewat form di atas."
          />
        ) : (
          <AccountList accounts={accounts} actor={{ id: user.id, role: user.role }} />
        )}
      </section>
    </div>
  );
}
