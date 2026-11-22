import type { Metadata } from "next";
import { NewPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Buat password baru" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl leading-tight font-semibold tracking-tight">Buat password baru</h1>
      <p className="mt-3 text-subtle-foreground">
        Password ini dipakai untuk masuk ke portal berikutnya.
      </p>
      <div className="mt-6">
        <NewPasswordForm />
      </div>
    </>
  );
}
