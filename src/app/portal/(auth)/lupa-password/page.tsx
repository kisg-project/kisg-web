import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Lupa password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        Lupa password
      </h1>
      <p className="mt-3 text-subtle-foreground">
        Masukkan email akun portal. Kami kirim tautan untuk membuat password baru.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </>
  );
}
