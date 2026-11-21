import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { careerLevelInfo } from "@/config/careers";
import { listCmsCareers, requireCmsUser } from "@/features/cms-panel";
import { formatDateWIB } from "@/lib/format";

export const metadata: Metadata = { title: "Lowongan" };

function StatusBadge({ status }: { status: "draft" | "terbit" }) {
  return (
    <Badge variant={status === "terbit" ? "default" : "secondary"}>
      {status === "terbit" ? "Terbit" : "Draf"}
    </Badge>
  );
}

export default async function CmsCareersPage() {
  await requireCmsUser();
  const careers = await listCmsCareers();
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Lowongan"
          description="Lowongan di halaman /karir, dikelompokkan per jenjang."
        />
        <Button asChild>
          <Link href="/cms/lowongan/baru">
            <Plus aria-hidden="true" />
            Buat lowongan
          </Link>
        </Button>
      </div>
      {careers.length === 0 ? (
        <EmptyState
          title="Belum ada lowongan."
          description="Buat lowongan pertama. Halaman karir menampilkannya di kartu jenjangnya."
        />
      ) : (
        <ul aria-label="Daftar lowongan CMS" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {careers.map((career) => (
            <li key={career.id}>
              <Link
                href={`/cms/lowongan/${career.id}`}
                className="group flex lift flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:text-primary">
                    {career.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {careerLevelInfo(career.level)?.title ?? "Tanpa jenjang"}
                    {career.closesOn ? `, ditutup ${formatDateWIB(career.closesOn)}` : ""}
                  </span>
                </span>
                <StatusBadge status={career.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
