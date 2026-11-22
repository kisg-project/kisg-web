import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Lupa password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl leading-tight font-semibold tracking-tight">Lupa password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Kode 6 digit dikirim ke email Anda.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </>
  );
}
