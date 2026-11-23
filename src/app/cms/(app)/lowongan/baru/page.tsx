import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CareerForm, requireCmsUser } from "@/features/cms-panel";

export const metadata: Metadata = { title: "Buat lowongan" };

export default async function CmsNewCareerPage() {
  await requireCmsUser();
  return (
    <div className="tone-violet grid gap-4 [&>:not(:first-child)]:mx-auto [&>:not(:first-child)]:w-full [&>:not(:first-child)]:max-w-4xl">
      <PageHeader
        title="Buat lowongan"
        description="Pilih jenjang supaya lowongan tampil di kartu yang tepat."
      />
      <CareerForm />
    </div>
  );
}
