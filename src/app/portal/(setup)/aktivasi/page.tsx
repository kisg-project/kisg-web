import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/config/portal";
import { ActivationForm } from "@/features/account";
import { requirePortalUser } from "@/features/auth";
import { avatarUrl } from "@/features/users";

export const metadata: Metadata = { title: "Aktifkan akun" };

/**
 * Halaman pertama setelah membuka tautan undangan (dan untuk akun lama yang belum punya foto atau
 * nomor HP). Akun yang sudah lengkap langsung ke berandanya.
 */
export default async function ActivationPage() {
  const user = await requirePortalUser(undefined, { allowIncomplete: true, skipWorkReport: true });
  if (user.complete) redirect(safeNextPath(null, user.roles));
  return (
    <>
      <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        Aktifkan akun
      </h1>
      <p className="mt-3 text-subtle-foreground">
        Lengkapi foto profil, nomor HP, dan password. Setelah itu Anda langsung masuk ke beranda.
      </p>
      <div className="mt-6">
        <ActivationForm
          email={user.email}
          fullName={user.fullName}
          phone={user.phone}
          avatarUrl={await avatarUrl(user.avatarPath)}
          hasAvatar={Boolean(user.avatarPath)}
          needsPassword={user.needsPassword}
        />
      </div>
    </>
  );
}
