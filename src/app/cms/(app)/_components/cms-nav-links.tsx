"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CMS_NAV } from "@/config/cms";
import { cn } from "@/lib/utils";

/** Menu panel CMS. Path di subdomain CMS tanpa awalan /cms, jadi dicocokkan tanpa awalan itu. */
export function CmsNavLinks() {
  const pathname = usePathname();
  const current = pathname.startsWith("/cms")
    ? pathname
    : `/cms${pathname === "/" ? "" : pathname}`;
  return (
    <nav aria-label="Menu CMS" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="flex gap-1 overflow-x-auto">
        {CMS_NAV.map((item) => {
          const active = item.href === "/cms" ? current === "/cms" : current.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-accent",
                  active ? "bg-primary-50 text-primary-800" : "text-subtle-foreground",
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
