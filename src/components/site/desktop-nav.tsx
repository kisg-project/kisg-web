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

/** Menu lengkap di layar lebar. Garis emas tumbuh di bawah menu saat di-hover dan pada halaman aktif. */
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
                  "group relative inline-flex h-11 items-center px-3 text-sm font-semibold text-foreground transition-colors hover:text-primary",
                  active && "text-primary",
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 bottom-1.5 h-0.5 origin-left scale-x-0 rounded-sm bg-highlight transition-transform duration-200 group-hover:scale-x-100",
                    active && "scale-x-100",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
