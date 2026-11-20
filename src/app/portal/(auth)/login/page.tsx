import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/portal/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const message = typeof params.error === "string" ? params.error : undefined;
  return (
    <>
      <h1 className="text-xl font-bold">Masuk ke portal</h1>
      <p className="mt-1 text-sm text-muted-foreground">Khusus karyawan KIS Group.</p>
      <div className="mt-6">
        <LoginForm next={next} message={message} />
      </div>
    </>
  );
}
