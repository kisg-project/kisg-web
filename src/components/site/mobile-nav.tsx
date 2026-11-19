"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteNav } from "@/config/nav";
import { siteConfig, whatsappLink } from "@/config/site";

/** Menu ringkas untuk layar kecil (CLAUDE.md bagian 6, responsif). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu">
          <Menu aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigasi {siteConfig.name}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigasi utama" className="px-4">
          <ul className="flex flex-col">
            {siteNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="flex h-12 items-center rounded-md px-3 text-base font-semibold hover:bg-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-4 pb-safe">
          <Button asChild className="w-full">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <Phone aria-hidden="true" />
              Hubungi marketing
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
