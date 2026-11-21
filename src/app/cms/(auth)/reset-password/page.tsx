import type { Metadata } from "next";
import { NewPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Buat password baru" };

export default function CmsResetPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-bold">Buat password baru</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Password ini dipakai untuk masuk ke panel CMS berikutnya.
      </p>
      <div className="mt-6">
        <NewPasswordForm />
      </div>
    </>
  );
}
