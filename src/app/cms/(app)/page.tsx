import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getCmsSummary, requireCmsUser } from "@/features/cms-panel";

export const metadata: Metadata = { title: "Ringkasan" };

export default async function CmsHomePage() {
  const user = await requireCmsUser();
  const summary = await getCmsSummary();
  const cards = [
    {
      href: "/cms/berita",
      title: "Berita",
      icon: Newspaper,
      published: summary.posts.published,
      drafts: summary.posts.drafts,
    },
    {
      href: "/cms/lowongan",
      title: "Lowongan",
      icon: BriefcaseBusiness,
      published: summary.careers.published,
      drafts: summary.careers.drafts,
    },
  ] as const;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Panel CMS"
        description={`Masuk sebagai ${user.fullName || user.email}. Perubahan yang diterbitkan langsung tampil di website.`}
      />
      <ul aria-label="Ringkasan konten" className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="group flex h-full lift items-start gap-4 rounded-lg border bg-card p-5"
            >
              <span className="icon-chip flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                <card.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold group-hover:text-primary">{card.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground tabular">
                  {card.published} terbit, {card.drafts} draf
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="size-5 text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
