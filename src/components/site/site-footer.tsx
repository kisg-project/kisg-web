import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { OfficeMap } from "@/components/site/office-map";
import { footerNav, withProjectsHref } from "@/config/nav";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";
import { getProjectsHref } from "@/features/projects";

const linkClass =
  "inline-flex min-h-11 items-center underline-offset-4 transition-colors hover:text-white hover:underline";

export async function SiteFooter() {
  const projectsHref = await getProjectsHref();
  return (
    <footer className="bg-footer pb-safe text-footer-foreground">
      <Container className="grid gap-8 border-b border-primary-800 py-12 lg:grid-cols-12 lg:items-center lg:py-16">
        <div className="min-w-0 lg:col-span-5">
          <Logo tone="light" imageClassName="h-16 w-auto min-w-24" />
          <p className="mt-4 text-sm font-semibold text-white">{siteConfig.legalName}</p>
          <address className="mt-3 not-italic">
            <p className="text-sm font-semibold text-gold-400">Kantor pemasaran</p>
            <p className="mt-2 flex gap-2 text-sm">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{formatOfficeAddress()}</span>
            </p>
          </address>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <OfficeMap />
        </div>
      </Container>
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title} className="min-w-0 lg:col-span-3">
            <p className="text-sm font-semibold text-gold-400">{group.title}</p>
            <ul className="mt-2 flex flex-col text-sm">
              {withProjectsHref(group.items, projectsHref).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="min-w-0 lg:col-span-3">
          <p className="text-sm font-semibold text-gold-400">Kontak</p>
          <ul className="mt-2 flex flex-col text-sm">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${siteConfig.whatsapp.display}`}
                className={`${linkClass} gap-2`}
              >
                <Phone aria-hidden="true" className="size-4" />
                {siteConfig.whatsapp.display}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${siteConfig.instagram.handle}`}
                className={`${linkClass} gap-2`}
              >
                <InstagramIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 break-all">{siteConfig.instagram.handle}</span>
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-primary-800">
        <Container className="py-4 text-xs">&copy; {siteConfig.legalName}</Container>
      </div>
    </footer>
  );
}
