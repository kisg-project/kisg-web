"use client";

import type { ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loading03Icon, Settings02Icon, UserCircleIcon } from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import type { PortalNavItem } from "@/config/portal-nav";

function normalize(pathname: string): string {
  return pathname.startsWith("/portal") ? pathname : `/portal${pathname === "/" ? "" : pathname}`;
}

function isActive(pathname: string, item: Pick<PortalNavItem, "href" | "home">) {
  const path = normalize(pathname);
  if (item.home) return path === "/portal" || path === item.href;
  return path === item.href || path.startsWith(`${item.href}/`);
}

const CIRCLE =
  "flex size-10 items-center justify-center rounded-full border transition-colors motion-safe:active:scale-95";
const IDLE =
  "border-(--line-strong) bg-card text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800";
const ACTIVE = "border-primary-800 bg-primary-700 text-white";

function NavIcon({ icon }: { icon: AppIcon }) {
  const { pending } = useLinkStatus();
  return (
    <Icon
      icon={pending ? Loading03Icon : icon}
      className={cn("size-[1.125rem]", pending && "animate-spin")}
    />
  );
}

function NavCircle({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: AppIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={label}
      className={cn(CIRCLE, active ? ACTIVE : IDLE)}
    >
      <NavIcon icon={icon} />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function PortalBottomNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  const account = { href: "/portal/akun", home: false };
  return (
    <nav
      aria-label="Menu portal bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-(--line-strong) bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {items.map((item) => (
          <li key={item.href}>
            <NavCircle
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item)}
            />
          </li>
        ))}
        <li>
          <NavCircle
            href={account.href}
            label="Akun"
            icon={UserCircleIcon}
            active={isActive(pathname, account)}
          />
        </li>
      </ul>
    </nav>
  );
}

export function PortalSidebarNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-(--line-strong) bg-card pt-[env(safe-area-inset-top)] pb-4 lg:flex">
      <Link
        href="/portal"
        aria-label="Beranda portal"
        className="flex h-14 shrink-0 items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ikon logo kecil dari route ikon aplikasi, bukan konten */}
        <img
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-full border border-(--line-strong)"
        />
      </Link>
      <span aria-hidden="true" className="mb-3 w-8 border-t-2 border-dotted border-neutral-400" />
      <nav
        aria-label="Menu portal"
        className="flex min-h-0 flex-1 flex-col items-center gap-2.5 overflow-y-auto"
      >
        {items.map((item) => (
          <NavCircle
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item)}
          />
        ))}
      </nav>
      <span aria-hidden="true" className="my-3 w-8 border-t-2 border-dotted border-neutral-400" />
      <NavCircle
        href="/portal/akun"
        label="Pengaturan akun"
        icon={Settings02Icon}
        active={isActive(pathname, { href: "/portal/akun", home: false })}
      />
    </aside>
  );
}

export function StickyHeader({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-(--line-strong) bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      {children}
    </header>
  );
}
