"use client";

import { useEffect, useState, type ReactNode } from "react";
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

/** Path di subdomain portal tanpa awalan /portal, jadi dicocokkan setelah awalan ditambahkan. */
function normalize(pathname: string): string {
  return pathname.startsWith("/portal") ? pathname : `/portal${pathname === "/" ? "" : pathname}`;
}

function isActive(pathname: string, href: string) {
  const path = normalize(pathname);
  return path === href || path.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  vertical,
}: {
  item: PortalNavItem;
  active: boolean;
  vertical: boolean;
}) {
  const Icon = ICONS[item.href] ?? LayoutDashboard;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-1 text-[0.68rem] tracking-wide transition-colors select-none motion-safe:active:scale-95",
        vertical ? "w-[4.5rem] rounded-2xl py-2.5" : "min-w-0 flex-1 rounded-2xl py-2",
        active
          ? "bg-primary-50 font-bold text-primary-800"
          : "font-medium text-subtle-foreground hover:text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-6" strokeWidth={active ? 2.4 : 2} />
      <span className="max-w-full truncate">{item.shortLabel}</span>
    </Link>
  );
}

/** Rel menu melayang di kiri layar (desktop), gaya aplikasi. */
export function PortalSidebarNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Menu portal"
      className="fixed top-1/2 left-5 z-30 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-[2rem] bg-background px-2 py-3 shadow-[0_18px_40px_-24px_rgb(11_61_54/0.45)] ring-1 ring-foreground/5 lg:flex"
    >
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} vertical />
      ))}
    </nav>
  );
}

/** Menu pil melayang di bawah layar (HP dan tablet). */
export function PortalBottomNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Menu portal bawah"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-stretch gap-1 rounded-[1.75rem] bg-background p-1.5 shadow-[0_18px_40px_-20px_rgb(11_61_54/0.45)] ring-1 ring-foreground/5 lg:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          vertical={false}
        />
      ))}
    </nav>
  );
}

/** Header lengket yang menjadi buram saat halaman digulir. */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 8);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        "sticky top-0 z-30 border-b border-transparent pt-[env(safe-area-inset-top)] motion-safe:transition-[background-color,box-shadow,border-color] motion-safe:duration-200",
        scrolled &&
          "border-primary-100 bg-background/85 shadow-[0_10px_30px_-22px_rgb(11_61_54/0.55)] backdrop-blur-xl",
      )}
    >
      {children}
    </header>
  );
}
