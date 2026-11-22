import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { WORK_REPORT_LABEL, type WorkReportKind } from "@/config/attendance";
import { PORTAL_AREAS } from "@/config/portal";
import { getMyAttendance, getMyWorkReports, WorkReportForm } from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { formatDateWIB } from "@/lib/format";

const ROLES = PORTAL_AREAS.find((area) => area.prefix === "/portal/absensi")?.roles ?? [];

/**
 * Rencana kegiatan (setelah clock in) atau hasil kerja (setelah clock out). Halaman ini dikecualikan
 * dari pengalihan laporan wajib, dan kembali ke absensi kalau langkah sebelumnya belum dilakukan.
 */
export async function WorkReportPage({ kind }: { kind: WorkReportKind }) {
  const user = await requirePortalUser(ROLES, { skipWorkReport: true });
  const [{ today }, reports] = await Promise.all([
    getMyAttendance(user.id),
    getMyWorkReports(user.id),
  ]);
  if (!today || (kind === "hasil" && !today.clockOutAt)) redirect("/portal/absensi");
  const current = reports[kind];
  return (
    <div className="tone-violet grid gap-4">
      <PageHeader
        backHref="/portal/absensi"
        backLabel="Kembali ke absensi"
        title={WORK_REPORT_LABEL[kind].title}
        description={formatDateWIB(new Date())}
      />
      <section className="mx-auto w-full max-w-lg rounded-xl border border-(--line-strong) bg-card p-4">
        <WorkReportForm
          kind={kind}
          initial={current ? { content: current.content, attachments: current.attachments } : null}
        />
      </section>
    </div>
  );
}
