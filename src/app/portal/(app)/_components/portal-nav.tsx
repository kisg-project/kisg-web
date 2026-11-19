"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "/portal/admin": Settings,
  "/portal/owner": LayoutDashboard,
  "/portal/crm": UsersRound,
  "/portal/marketing": Megaphone,
  "/portal/lapangan": ClipboardList,
  "/portal/absensi": CalendarCheck,
};

export interface PortalNavItem {
  href: string;
  label: string;
  shortLabel: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar di desktop. */
export function PortalSidebarNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu portal" className="grid gap-1 p-3">
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? LayoutDashboard;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted",
              active && "bg-primary-50 text-primary-800 hover:bg-primary-100",
            )}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Navigasi bawah di HP. */
export function PortalBottomNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Menu portal bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutDashboard;
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium text-muted-foreground",
                  active && "text-primary-700",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
