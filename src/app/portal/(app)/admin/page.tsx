import type { Metadata } from "next";
import Link from "next/link";
import { requirePortalUser } from "@/features/auth";
import { HomeHeader } from "../_components/home-header";
import { ArrowRight02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export const metadata: Metadata = { title: "Admin" };

const MODULES = [
  {
    href: "/portal/owner/karyawan",
    title: "Karyawan",
    description: "Undang karyawan, atur role, dan nonaktifkan akun.",
    icon: UserGroupIcon,
  },
] as const;

export default async function AdminPage() {
  const user = await requirePortalUser(["owner", "admin"]);
  return (
    <div className="tone-mint grid gap-6">
      <HomeHeader roles={user.roles} description="Admin" />
      <h2 className="text-xl font-bold">Admin</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((module) => (
          <li key={module.title}>
            <Link
              href={module.href}
              className="group flex h-full lift items-start gap-4 rounded-lg border bg-card p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                <Icon icon={module.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold group-hover:text-primary">{module.title}</span>
                <span className="block text-sm text-muted-foreground">{module.description}</span>
              </span>
              <Icon
                icon={ArrowRight02Icon}
                aria-hidden="true"
                className="size-5 text-primary transition-transform group-hover:translate-x-1"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
