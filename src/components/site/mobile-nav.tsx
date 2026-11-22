"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "@/config/nav";
import { siteConfig, whatsappLink } from "@/config/site";
import { Call02Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
          <Icon icon={Menu01Icon} aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigasi {siteConfig.name}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigasi utama" className="px-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="flex h-12 items-center rounded-full px-4 text-base font-semibold transition-colors hover:bg-primary-50 hover:text-primary-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-4 pb-safe">
          <Button asChild size="lg" className="w-full">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <Icon icon={Call02Icon} aria-hidden="true" />
              Hubungi marketing
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
