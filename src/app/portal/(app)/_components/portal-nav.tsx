"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  Loading03Icon,
  Moon02Icon,
  Settings02Icon,
  Sun03Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
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

const subscribeRoot = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tema", "data-rel"],
  });
  return () => {
    observer.disconnect();
  };
};

function useRootFlag(name: "tema" | "rel", on: string) {
  return useSyncExternalStore(
    subscribeRoot,
    () => document.documentElement.getAttribute(`data-${name}`) === on,
    () => false,
  );
}

function setRootFlag(name: "tema" | "rel", on: string, value: boolean) {
  const root = document.documentElement;
  if (value) root.setAttribute(`data-${name}`, on);
  else root.removeAttribute(`data-${name}`);
  try {
    localStorage.setItem(`kis-${name}`, value ? on : "");
  } catch {
    return;
  }
}

const RAIL_ROW =
  "flex items-center gap-3 rounded-full in-data-[rel=lebar]:w-full in-data-[rel=lebar]:pr-3";

function RailLink({
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
      className={cn(
        RAIL_ROW,
        "group/rail transition-colors in-data-[rel=lebar]:hover:bg-neutral-100 dark:in-data-[rel=lebar]:hover:bg-neutral-800",
        active && "in-data-[rel=lebar]:bg-(--band-soft,var(--color-primary-50))",
      )}
    >
      <span className={cn(CIRCLE, "shrink-0", active ? ACTIVE : IDLE)}>
        <NavIcon icon={icon} />
      </span>
      <span className="rail-label truncate text-[0.8125rem] font-medium">{label}</span>
    </Link>
  );
}

function ThemeKnob() {
  const dark = useRootFlag("tema", "gelap");
  return (
    <div className={cn(RAIL_ROW, "justify-center in-data-[rel=lebar]:justify-start")}>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Mode gelap"
        title={dark ? "Mode terang" : "Mode gelap"}
        onClick={() => {
          setRootFlag("tema", "gelap", !dark);
        }}
        className="hit-44 relative flex h-6 w-11 shrink-0 items-center rounded-full border border-(--line-strong) bg-gold-100 px-0.5 transition-colors dark:bg-info-900"
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border border-(--line-strong) bg-card transition-transform duration-200",
            dark && "translate-x-[1.125rem]",
          )}
        >
          <Icon icon={dark ? Moon02Icon : Sun03Icon} className="size-3" />
        </span>
      </button>
      <span aria-hidden="true" className="rail-label text-[0.8125rem] font-medium">
        {dark ? "Mode gelap" : "Mode terang"}
      </span>
    </div>
  );
}

export function PortalSidebarNav({ items }: { items: readonly PortalNavItem[] }) {
  const pathname = usePathname();
  const wide = useRootFlag("rel", "lebar");
  if (items.length === 0) return null;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-(--rail-w) flex-col items-center gap-2.5 border-r border-(--line-strong) bg-card pt-[env(safe-area-inset-top)] pb-4 transition-[width] duration-200 in-data-[rel=lebar]:items-stretch in-data-[rel=lebar]:px-3 lg:flex">
      <div className="flex h-14 shrink-0 items-center gap-3 in-data-[rel=lebar]:px-0">
        <Link href="/portal" aria-label="Beranda portal" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- ikon logo kecil dari folder brand, bukan konten */}
          <img
            src="/brand/pwa-192.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full border border-(--line-strong)"
          />
        </Link>
        <span className="rail-label text-sm font-semibold">KIS Operasional</span>
      </div>
      <button
        type="button"
        aria-expanded={wide}
        aria-label={wide ? "Ciutkan menu" : "Lebarkan menu"}
        title={wide ? "Ciutkan menu" : "Lebarkan menu"}
        onClick={() => {
          setRootFlag("rel", "lebar", !wide);
        }}
        className={cn(
          RAIL_ROW,
          "text-muted-foreground hover:text-foreground in-data-[rel=lebar]:pl-2.5",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-neutral-400">
          <Icon icon={wide ? ArrowLeftDoubleIcon : ArrowRightDoubleIcon} className="size-4" />
        </span>
        <span className="rail-label text-xs font-medium">Ciutkan menu</span>
      </button>
      <span
        aria-hidden="true"
        className="w-8 border-t-2 border-dotted border-neutral-400 in-data-[rel=lebar]:w-full"
      />
      <nav
        aria-label="Menu portal"
        className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto in-data-[rel=lebar]:items-stretch"
      >
        {items.map((item) => (
          <RailLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item)}
          />
        ))}
      </nav>
      <span
        aria-hidden="true"
        className="w-8 border-t-2 border-dotted border-neutral-400 in-data-[rel=lebar]:w-full"
      />
      <RailLink
        href="/portal/akun"
        label="Pengaturan akun"
        icon={Settings02Icon}
        active={isActive(pathname, { href: "/portal/akun", home: false })}
      />
      <ThemeKnob />
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
