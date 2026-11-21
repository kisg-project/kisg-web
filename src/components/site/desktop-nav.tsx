"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  const base = href.split("/").slice(0, 2).join("/");
  return pathname === href || pathname.startsWith(`${base}/`) || pathname === base;
}

/** Menu lengkap di layar lebar. Latar pil mint muncul saat di-hover dan pada halaman aktif. */
export function DesktopNav({ items }: { items: readonly NavItem[] }) {
  return <NavLinks items={items} pathname={usePathname()} />;
}

/** Tanpa penanda halaman aktif. Dipakai sebagai fallback Suspense sebelum path diketahui. */
export function NavLinks({ items, pathname }: { items: readonly NavItem[]; pathname: string }) {
  return (
    <nav aria-label="Navigasi utama" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-neutral-800 transition-colors duration-200 hover:bg-primary-50 hover:text-primary-800",
                  active && "bg-primary-50 text-primary-800",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
