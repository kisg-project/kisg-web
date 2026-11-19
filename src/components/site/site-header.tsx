import Link from "next/link";
import { Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { siteNav } from "@/config/nav";
import { whatsappLink } from "@/config/site";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-(--header-height) border-b bg-background pt-safe">
      <Container className="flex h-full items-center justify-between gap-4">
        <Logo eager />
        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {siteNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex h-11 items-center rounded-md px-3 text-sm font-semibold text-foreground hover:bg-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <Phone aria-hidden="true" />
              Hubungi marketing
            </a>
          </Button>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
