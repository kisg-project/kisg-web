import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutTemplate, UsersRound } from "lucide-react";
import { requirePortalUser } from "@/features/auth";
import { PortalGreeting } from "../_components/portal-greeting";

export const metadata: Metadata = { title: "Admin" };

const MODULES = [
  {
    href: "/portal/admin/pengguna",
    title: "Pengguna",
    description: "Undang karyawan, atur role, dan nonaktifkan akun.",
    icon: UsersRound,
    ready: true,
  },
  {
    href: "/portal/admin",
    title: "Konten website",
    description: "Banner, proyek, berita, promo, dan lowongan. Dibangun di Fase 4.",
    icon: LayoutTemplate,
    ready: false,
  },
] as const;

export default async function AdminPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  return (
    <div className="grid gap-6">
      <PortalGreeting fullName={user.fullName} role={user.role} />
      <h2 className="text-xl font-bold">Admin</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((module) => (
          <li key={module.title}>
            {module.ready ? (
              <Link
                href={module.href}
                className="group flex h-full lift items-start gap-4 rounded-lg border bg-card p-5"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                  <module.icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold group-hover:text-primary">{module.title}</span>
                  <span className="block text-sm text-muted-foreground">{module.description}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 text-primary transition-transform group-hover:translate-x-1"
                />
              </Link>
            ) : (
              <div className="flex h-full items-start gap-4 rounded-lg border border-dashed p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface text-muted-foreground">
                  <module.icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{module.title}</span>
                  <span className="block text-sm text-muted-foreground">{module.description}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
