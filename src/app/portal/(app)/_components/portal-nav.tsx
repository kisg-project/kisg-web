"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Building03Icon,
  CalendarCheckIn01Icon,
  DashboardSquare01Icon,
  Loading03Icon,
  Megaphone01Icon,
  Menu01Icon,
  Settings02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface PortalNavItem {
  href: string;
  label: string;
  shortLabel: string;
}

const AREA: Record<string, { icon: AppIcon; tone: string }> = {
  "/portal/owner": { icon: DashboardSquare01Icon, tone: "bg-primary-100 text-primary-800" },
  "/portal/crm": { icon: UserGroupIcon, tone: "bg-violet-100 text-violet-700" },
  "/portal/marketing": { icon: Megaphone01Icon, tone: "bg-orange-100 text-orange-700" },
  "/portal/lapangan": { icon: Building03Icon, tone: "bg-info-100 text-info-700" },
  "/portal/absensi": { icon: CalendarCheckIn01Icon, tone: "bg-success-100 text-success-700" },
  "/portal/admin": { icon: Settings02Icon, tone: "bg-neutral-200 text-neutral-800" },
};

const areaOf = (href: string) => AREA[href] ?? { icon: DashboardSquare01Icon, tone: "" };

function normalize(pathname: string): string {
  return pathname.startsWith("/portal") ? pathname : `/portal${pathname === "/" ? "" : pathname}`;
}

function isActive(pathname: string, href: string) {
  const path = normalize(pathname);
  return path === href || path.startsWith(`${href}/`);
}

function NavIcon({ icon }: { icon: AppIcon }) {
  const { pending } = useLinkStatus();
  return <Icon icon={pending ? Loading03Icon : icon} className={cn(pending && "animate-spin")} />;
}

export function PortalBottomNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Menu portal bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-(--line-strong) bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${String(items.length)}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className="flex h-16 w-full items-center justify-center select-none motion-safe:active:scale-95"
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-primary-700 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300",
                  )}
                >
                  <NavIcon icon={areaOf(item.href).icon} />
                </span>
                <span className="sr-only">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PortalSidebarNav({
  items,
  footer,
}: {
  items: readonly PortalNavItem[];
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[4.5rem] flex-col items-center border-r border-(--line-strong) bg-card py-4 lg:flex">
      <Link
        href="/portal"
        aria-label="Beranda portal"
        className="mb-4 flex size-11 items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ikon logo kecil dari route ikon aplikasi, bukan konten */}
        <img src="/icon.png" alt="" width={40} height={40} className="size-10 rounded-xl" />
      </Link>
      <span
        aria-hidden="true"
        className="mb-4 h-px w-8 border-t border-dashed border-(--line-strong)"
      />
      <nav aria-label="Menu portal" className="flex flex-1 flex-col items-center gap-2.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border transition-colors motion-safe:active:scale-95",
                active
                  ? "border-primary-700 bg-primary-700 text-white"
                  : "border-(--line-strong) text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200",
              )}
            >
              <NavIcon icon={areaOf(item.href).icon} />
              <span className="sr-only">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
      {footer}
    </aside>
  );
}

export function PortalDrawer({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Buka semua menu"
        className="flex size-10 items-center justify-center rounded-xl border border-(--line-strong) bg-card lg:hidden"
      >
        <Icon icon={Menu01Icon} />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="portal-canvas w-[17rem] gap-0 border-r border-(--line-strong) bg-card p-0"
      >
        <div className="flex items-center gap-3 border-b border-(--line-soft) px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- ikon logo kecil dari route ikon aplikasi, bukan konten */}
          <img src="/icon.png" alt="" width={36} height={36} className="size-9 rounded-xl" />
          <div>
            <SheetTitle className="text-sm font-semibold">KIS Operasional</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Semua menu
            </SheetDescription>
          </div>
        </div>
        <ul className="grid gap-1 p-3">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const area = areaOf(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors",
                    active ? "bg-primary-50 text-primary-900" : "hover:bg-neutral-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full",
                      area.tone,
                    )}
                  >
                    <Icon icon={area.icon} className="size-[1.125rem]" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 4);
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
        "sticky top-0 z-30 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur-md motion-safe:transition-colors",
        scrolled ? "border-(--line-strong)" : "border-(--line-soft)",
      )}
    >
      {children}
    </header>
  );
}
