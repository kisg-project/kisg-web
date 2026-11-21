"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  LoaderCircle,
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

/** Ikon menu yang berputar selama halaman tujuan dimuat, supaya ketukan langsung terasa ditanggapi. */
function NavIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  const { pending } = useLinkStatus();
  if (pending) {
    return <LoaderCircle aria-hidden="true" className="size-[1.35rem] shrink-0 animate-spin" />;
  }
  return (
    <Icon aria-hidden="true" className="size-[1.35rem] shrink-0" strokeWidth={active ? 2.4 : 2} />
  );
}

/**
 * Menu pil melayang di bawah layar (HP dan tablet), gaya tab bar aplikasi: wadah pil gelap, menu aktif
 * melebar menjadi pil putih berlabel, menu lain cukup ikon (labelnya tetap dibaca pembaca layar). Sudut
 * penanda aktif konsentris dengan wadahnya.
 */
export function PortalBottomNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Menu portal bawah"
      className="fixed inset-x-4 bottom-[max(0.875rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-1 rounded-full bg-primary-950/95 p-1.5 shadow-[0_20px_44px_-18px_rgb(1_41_34/0.65)] ring-1 ring-white/10 backdrop-blur-xl lg:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-full transition-[flex-grow,background-color,color] duration-300 ease-out select-none motion-safe:active:scale-95",
              active
                ? "grow-[2.4] basis-0 bg-white px-4 text-primary-900 shadow-sm"
                : "grow basis-0 text-white/70 hover:text-white",
            )}
          >
            <NavIcon icon={ICONS[item.href] ?? LayoutDashboard} active={active} />
            <span className={active ? "truncate text-sm font-bold" : "sr-only"}>
              {item.shortLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Rel menu melayang di kiri layar (desktop). Penanda aktif konsentris dengan wadahnya. */
export function PortalSidebarNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Menu portal"
      className="fixed top-1/2 left-5 z-30 hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-[2.25rem] bg-background p-2 shadow-[0_18px_40px_-24px_rgb(1_60_52/0.45)] ring-1 ring-primary-100 lg:flex"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-[4.75rem] flex-col items-center justify-center gap-1 rounded-[1.75rem] py-3 text-[0.68rem] transition-colors duration-200 select-none motion-safe:active:scale-95",
              active
                ? "bg-primary-900 font-bold text-white"
                : "font-semibold text-subtle-foreground hover:bg-primary-50 hover:text-primary-900",
            )}
          >
            <NavIcon icon={ICONS[item.href] ?? LayoutDashboard} active={active} />
            <span className="max-w-full truncate px-1">{item.shortLabel}</span>
          </Link>
        );
      })}
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
