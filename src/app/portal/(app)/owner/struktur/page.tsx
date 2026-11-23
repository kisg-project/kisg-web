import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { requirePortalUser } from "@/features/auth";
import { OrgChart, vacantCount } from "@/features/organization";
import { getOrgChart } from "@/features/organization/server";

export const metadata: Metadata = { title: "Struktur organisasi" };

export default async function StructurePage() {
  await requirePortalUser(["owner", "admin"]);
  const chart = await getOrgChart();
  const vacant = vacantCount(chart.positions);
  return (
    <div className="tone-blue grid grid-cols-[minmax(0,1fr)] gap-4">
      <PageHeader
        title="Struktur organisasi"
        description={`${String(chart.positions.length)} jabatan, ${String(vacant)} belum terisi`}
      />
      <OrgChart chart={chart} />
    </div>
  );
}
