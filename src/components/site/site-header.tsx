import { Suspense } from "react";
import { Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { siteNav, withProjectsHref } from "@/config/nav";
import { whatsappLink } from "@/config/site";
import { getProjectsHref } from "@/features/projects";
import { DesktopNav, NavLinks } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const items = withProjectsHref(siteNav, await getProjectsHref());
  return (
    <header className="sticky top-0 z-40 h-(--header-height) border-b bg-background/95 pt-safe backdrop-blur-sm supports-[backdrop-filter]:bg-background/85">
      <Container className="flex h-full items-center justify-between gap-4">
        <Logo eager />
        <Suspense fallback={<NavLinks items={items} pathname="" />}>
          <DesktopNav items={items} />
        </Suspense>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden xl:inline-flex">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <Phone aria-hidden="true" />
              Hubungi marketing
            </a>
          </Button>
          <MobileNav items={items} />
        </div>
      </Container>
    </header>
  );
}
