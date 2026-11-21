import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CareerForm, requireCmsUser } from "@/features/cms-panel";

export const metadata: Metadata = { title: "Buat lowongan" };

export default async function CmsNewCareerPage() {
  await requireCmsUser();
  return (
    <div className="grid max-w-4xl gap-6">
      <PageHeader
        title="Buat lowongan"
        description="Pilih jenjang supaya lowongan tampil di kartu yang tepat."
      />
      <CareerForm />
    </div>
  );
}
