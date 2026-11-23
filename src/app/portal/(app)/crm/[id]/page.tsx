import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Call02Icon, MessageMultiple01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { CRM_MANAGER_ROLES, LEAD_SOURCE_LABEL } from "@/config/crm";
import { requirePortalUser } from "@/features/auth";
import {
  ActivityDialog,
  LeadTimeline,
  ReassignDialog,
  SlaChip,
  StageBadge,
  StageDialog,
} from "@/features/crm";
import { getLead, listAssignableMarketing } from "@/features/crm/server";
import { formatDateTimeWIB, formatPhoneDisplay, toWhatsAppNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Detail lead" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LeadPage({ params }: PageProps<"/portal/crm/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const user = await requirePortalUser(["owner", "admin", "marketing_manager", "marketing"]);
  const lead = await getLead(id);
  if (!lead) notFound();
  const manager = user.roles.some((role) =>
    (CRM_MANAGER_ROLES as readonly string[]).includes(role),
  );
  const marketing = manager ? await listAssignableMarketing() : [];
  const contact =
    "hit-44 flex h-9 items-center gap-1.5 rounded-full border border-(--line-strong) bg-card px-3 text-xs font-medium transition-colors hover:bg-(--band-soft) motion-safe:active:scale-95";

  const rows: [string, string][] = [
    ["Nomor HP", formatPhoneDisplay(lead.phone)],
    ["Email", lead.email ?? "Belum ada"],
    ["Proyek", lead.projectName ?? "Belum ditentukan"],
    [
      "Sumber",
      lead.sourceDetail
        ? `${LEAD_SOURCE_LABEL[lead.source]}, ${lead.sourceDetail}`
        : LEAD_SOURCE_LABEL[lead.source],
    ],
    ["Marketing", lead.ownerName ?? "Antrean manajer"],
    ["Masuk", formatDateTimeWIB(lead.createdAt)],
  ];

  return (
    <div className="tone-violet grid grid-cols-[minmax(0,1fr)] gap-4">
      <PageHeader
        backHref="/portal/crm"
        backLabel="Kembali ke CRM"
        title={lead.fullName}
        description={lead.projectName ?? LEAD_SOURCE_LABEL[lead.source]}
        actions={
          <>
            <a href={`tel:${lead.phone}`} className={contact}>
              <Icon icon={Call02Icon} size={16} />
              Telepon
            </a>
            <a
              href={`https://wa.me/${toWhatsAppNumber(lead.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={contact}
            >
              <Icon icon={MessageMultiple01Icon} size={16} />
              WhatsApp
            </a>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section
          aria-labelledby="lead-data"
          className="grid content-start gap-3 rounded-xl border border-(--line-strong) bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="lead-data" className="text-sm font-semibold">
              Data lead
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <StageBadge stage={lead.stage} />
              <SlaChip lead={lead} />
            </div>
          </div>
          <dl className="grid gap-2 text-xs">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
            {lead.lostReason ? (
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                <dt className="text-muted-foreground">Alasan batal</dt>
                <dd className="break-words">{lead.lostReason}</dd>
              </div>
            ) : null}
            {lead.note ? (
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                <dt className="text-muted-foreground">Catatan</dt>
                <dd className="break-words whitespace-pre-line">{lead.note}</dd>
              </div>
            ) : null}
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-(--line-strong) pt-3">
            <StageDialog leadId={lead.id} stage={lead.stage} />
            {manager ? (
              <ReassignDialog
                leadId={lead.id}
                currentOwnerId={lead.ownerId}
                marketing={marketing}
              />
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="lead-riwayat"
          className="grid content-start gap-3 rounded-xl border border-(--line-strong) bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="lead-riwayat" className="text-sm font-semibold">
              Riwayat
            </h2>
            <ActivityDialog leadId={lead.id} />
          </div>
          <LeadTimeline items={lead.timeline} />
        </section>
      </div>
    </div>
  );
}
