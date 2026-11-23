import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import {
  CareerForm,
  DeleteContentButton,
  getCmsCareer,
  requireCmsUser,
} from "@/features/cms-panel";

export const metadata: Metadata = { title: "Ubah lowongan" };

export default async function CmsEditCareerPage({ params }: PageProps<"/cms/lowongan/[id]">) {
  await requireCmsUser();
  const { id } = await params;
  const career = /^[0-9a-f-]{36}$/i.test(id) ? await getCmsCareer(id) : null;
  if (!career) notFound();
  return (
    <div className="tone-violet grid gap-4 [&>:not(:first-child)]:mx-auto [&>:not(:first-child)]:w-full [&>:not(:first-child)]:max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Ubah lowongan" description={career.title} />
        <DeleteContentButton kind="lowongan" id={career.id} title={career.title} />
      </div>
      <CareerForm
        initial={{
          id: career.id,
          title: career.title,
          slug: career.slug,
          department: career.department ?? "",
          location: career.location ?? "",
          employmentType: career.employmentType ?? "",
          level: career.level ?? "berpengalaman",
          closesOn: career.closesOn ?? "",
          description: career.description,
          requirements: career.requirements,
          status: career.status,
        }}
      />
    </div>
  );
}
