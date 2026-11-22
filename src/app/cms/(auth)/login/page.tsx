import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Masuk" };

export default async function CmsLoginPage({ searchParams }: PageProps<"/cms/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const message = typeof params.error === "string" ? params.error : undefined;
  return (
    <>
      <h1 className="text-2xl leading-tight font-semibold tracking-tight">Masuk ke panel CMS</h1>
      <p className="mt-3 text-subtle-foreground">
        Khusus akun pengelola konten website. Karyawan masuk lewat portal.
      </p>
      <div className="mt-6">
        <LoginForm app="cms" next={next} message={message} />
      </div>
    </>
  );
}
