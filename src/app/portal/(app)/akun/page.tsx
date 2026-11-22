import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ROLE_LABELS } from "@/config/roles";
import { ChangePasswordForm, ProfileForm, ProfilePhotoForm } from "@/features/account";
import { FingerprintSetup } from "@/features/approvals";
import { activeCredential } from "@/features/approvals/server";
import { requirePortalUser } from "@/features/auth";
import { PushSetup } from "@/features/notifications";
import { pushConfigured } from "@/features/notifications/server";
import { env } from "@/env";
import { avatarUrl } from "@/features/users";

export const metadata: Metadata = { title: "Akun saya" };

export default async function AccountPage() {
  const user = await requirePortalUser(undefined, { skipWorkReport: true });
  const panel = "rounded-xl border border-(--line-strong) bg-card p-4";
  const heading = "mb-3 text-sm font-semibold";
  return (
    <div className="tone-gold grid gap-4">
      <PageHeader title="Akun saya" description={user.email} />
      <div className="grid max-w-3xl gap-4">
        <section aria-labelledby="akun-foto" className={panel}>
          <h2 id="akun-foto" className="sr-only">
            Foto profil
          </h2>
          <ProfilePhotoForm name={user.fullName} avatarUrl={await avatarUrl(user.avatarPath)} />
        </section>

        <section aria-labelledby="akun-data" className={panel}>
          <h2 id="akun-data" className={heading}>
            Data diri
          </h2>
          <ProfileForm fullName={user.fullName} phone={user.phone} />
        </section>

        <section aria-labelledby="akun-role" className={panel}>
          <h2 id="akun-role" className="text-sm font-semibold">
            Role
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Role hanya bisa diubah owner.</p>
          <ul aria-label="Role saya" className="mt-3 flex flex-wrap gap-1.5">
            {user.roles.map((role, index) => (
              <li
                key={role}
                className="inline-flex items-center gap-1.5 rounded-full border border-(--line-strong) bg-(--band-soft) px-2.5 py-0.5 text-[0.6875rem] font-medium"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-600" />
                {ROLE_LABELS[role]}
                {index === 0 && user.roles.length > 1 ? " (utama)" : ""}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="akun-sidik-jari" className={panel}>
          <h2 id="akun-sidik-jari" className={heading}>
            Sidik jari
          </h2>
          <FingerprintSetup registered={await activeCredential(user.id)} />
        </section>

        <section aria-labelledby="akun-notifikasi" className={panel}>
          <h2 id="akun-notifikasi" className={heading}>
            Notifikasi HP
          </h2>
          <PushSetup publicKey={pushConfigured() ? (env.VAPID_PUBLIC_KEY ?? null) : null} />
        </section>

        <section aria-labelledby="akun-password" className={panel}>
          <h2 id="akun-password" className={heading}>
            Ganti password
          </h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
