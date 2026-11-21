import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { OfficeMap } from "@/components/site/office-map";
import { footerNav, withProjectsHref } from "@/config/nav";
import { formatOfficeAddress, siteConfig, whatsappLink } from "@/config/site";
import { getProjectsHref } from "@/features/projects";

const linkClass =
  "inline-flex min-h-10 items-center underline-offset-4 transition-colors hover:text-white hover:underline";

const headingClass = "text-sm font-bold text-gold-400";

/**
 * Footer padat dan seimbang (keputusan owner, 21 November 2026): baris atas tiga kolom setara
 * (identitas, kantor dan email, peta tanpa bingkai), baris bawah empat kolom tautan yang tingginya mirip.
 */
export async function SiteFooter() {
  const projectsHref = await getProjectsHref();
  return (
    <footer className="rounded-t-4xl bg-footer pb-safe text-sm text-primary-100">
      <Container className="grid gap-10 border-b border-primary-800 py-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0">
          <Logo tone="light" imageClassName="h-14 w-auto min-w-24" />
          <p className="mt-4 font-semibold text-white">{siteConfig.legalName}</p>
          <p className="mt-2 max-w-sm leading-relaxed">{siteConfig.company.summary[0]}</p>
        </div>

        <div className="min-w-0">
          <address className="not-italic">
            <p className={headingClass}>Kantor pemasaran</p>
            <p className="mt-2 flex gap-2 leading-relaxed">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{formatOfficeAddress()}</span>
            </p>
          </address>
          <p className={`${headingClass} mt-6`}>Email</p>
          <ul className="mt-1 grid gap-1.5">
            {siteConfig.emails.map((item) => (
              <li key={item.address}>
                <a href={`mailto:${item.address}`} className={`${linkClass} min-h-8 gap-2`}>
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0 break-all">{item.address}</span>
                </a>
                <span className="block pl-6 text-xs text-primary-200">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 md:col-span-2 lg:col-span-1">
          <OfficeMap />
        </div>
      </Container>

      <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title} className="min-w-0">
            <p className={headingClass}>{group.title}</p>
            <ul className="mt-1 flex flex-col">
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
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <p className={headingClass}>Hubungi</p>
          <ul className="mt-1 flex flex-col">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${siteConfig.whatsapp.display}`}
                className={`${linkClass} gap-2`}
              >
                <Phone aria-hidden="true" className="size-4 shrink-0" />
                {siteConfig.whatsapp.display}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${siteConfig.instagram.handle}`}
                className={`${linkClass} min-w-0 gap-2`}
              >
                <InstagramIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 break-all">{siteConfig.instagram.handle}</span>
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-primary-800">
        <Container className="flex flex-col gap-1 py-4 text-xs sm:flex-row sm:justify-between">
          <span>&copy; {siteConfig.legalName}</span>
          <span>{siteConfig.domain}</span>
        </Container>
      </div>
    </footer>
  );
}
