import type { Metadata } from "next";
import { NewPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Buat password baru" };

export default function CmsResetPasswordPage() {
  return (
    <>
      <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        Buat password baru
      </h1>
      <p className="mt-3 text-subtle-foreground">
        Password ini dipakai untuk masuk ke panel CMS berikutnya.
      </p>
      <div className="mt-6">
        <NewPasswordForm />
      </div>
    </>
  );
}
