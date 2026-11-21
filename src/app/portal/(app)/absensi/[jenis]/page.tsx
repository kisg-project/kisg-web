import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ATTENDANCE_KIND_LABEL } from "@/config/attendance";
import { PORTAL_AREAS } from "@/config/portal";
import { ClockFlow, getMyAttendance } from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";

export const metadata: Metadata = { title: "Clock in atau clock out" };

const ROLES = PORTAL_AREAS.find((area) => area.prefix === "/portal/absensi")?.roles ?? [];

/** /portal/absensi/masuk atau /portal/absensi/pulang. Langkah yang sudah selesai kembali ke absensi. */
export default async function ClockPage({ params }: PageProps<"/portal/absensi/[jenis]">) {
  const { jenis } = await params;
  if (jenis !== "masuk" && jenis !== "pulang") notFound();
  const user = await requirePortalUser(ROLES);
  const { today } = await getMyAttendance(user.id);
  if (jenis === "masuk" && today) redirect("/portal/absensi");
  if (jenis === "pulang" && (!today || today.clockOutAt)) redirect("/portal/absensi");
  const label = ATTENDANCE_KIND_LABEL[jenis];
  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <PageHeader
        title={label}
        description="Pastikan GPS aktif dan wajah terlihat jelas. Foto hanya dari kamera."
      />
      <ClockFlow kind={jenis} homeHref="/portal/absensi" />
    </div>
  );
}
