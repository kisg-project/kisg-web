import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ROLE_LABELS } from "@/config/roles";
import { ChangePasswordForm, ProfileForm, ProfilePhotoForm } from "@/features/account";
import { requirePortalUser } from "@/features/auth";
import { avatarUrl } from "@/features/users";

export const metadata: Metadata = { title: "Akun saya" };

/** Akun saya: foto profil, nama, nomor HP, dan password. Role hanya bisa diubah owner. */
export default async function AccountPage() {
  const user = await requirePortalUser();
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Akun saya" description={user.email} />

      <section aria-labelledby="akun-foto" className="app-card p-5 sm:p-6">
        <h2 id="akun-foto" className="sr-only">
          Foto profil
        </h2>
        <ProfilePhotoForm name={user.fullName} avatarUrl={await avatarUrl(user.avatarPath)} />
      </section>

      <section aria-labelledby="akun-data" className="app-card p-5 sm:p-6">
        <h2 id="akun-data" className="mb-4 text-lg font-bold">
          Data diri
        </h2>
        <ProfileForm fullName={user.fullName} phone={user.phone} />
      </section>

      <section aria-labelledby="akun-role" className="app-card p-5 sm:p-6">
        <h2 id="akun-role" className="text-lg font-bold">
          Role
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Role hanya bisa diubah owner.</p>
        <ul aria-label="Role saya" className="mt-3 flex flex-wrap gap-1.5">
          {user.roles.map((role, index) => (
            <li
              key={role}
              className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800"
            >
              {ROLE_LABELS[role]}
              {index === 0 && user.roles.length > 1 ? " (utama)" : ""}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="akun-password" className="app-card p-5 sm:p-6">
        <h2 id="akun-password" className="mb-4 text-lg font-bold">
          Ganti password
        </h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
