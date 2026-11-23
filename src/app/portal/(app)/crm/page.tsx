import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CRM_MANAGER_ROLES } from "@/config/crm";
import { PORTAL_AREAS, ROLE_HOME } from "@/config/portal";
import { requirePortalUser } from "@/features/auth";
import { AddLeadDialog, LeadBoard, SlaDialog } from "@/features/crm";
import { getSlaMinutes, listLeads } from "@/features/crm/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomeIntro } from "../_components/module-placeholder";
import { ShortcutSection } from "../_components/shortcut-section";

export const metadata: Metadata = { title: "CRM" };

const ROLES = PORTAL_AREAS.find((area) => area.prefix === "/portal/crm")?.roles ?? [];
const LEAD_ROLES = ["owner", "admin", "marketing_manager", "marketing"] as const;

async function projectChoices() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .is("deleted_at", null)
    .order("sort_order");
  return data ?? [];
}

export default async function CrmPage() {
  const user = await requirePortalUser(ROLES);
  const isHome = ROLE_HOME[user.role] === "/portal/crm";
  const worksLeads = user.roles.some((role) => (LEAD_ROLES as readonly string[]).includes(role));
  const manager = user.roles.some((role) =>
    (CRM_MANAGER_ROLES as readonly string[]).includes(role),
  );
  const canSetSla = user.roles.includes("owner") || user.roles.includes("admin");

  const [leads, projects, slaMinutes] = worksLeads
    ? await Promise.all([listLeads(), projectChoices(), getSlaMinutes()])
    : [[], [], 0];

  const actions = worksLeads ? (
    <>
      {canSetSla ? <SlaDialog minutes={slaMinutes} /> : null}
      <AddLeadDialog projects={projects} />
    </>
  ) : null;

  const board = worksLeads ? <LeadBoard leads={leads} userId={user.id} manager={manager} /> : null;

  if (isHome) {
    return (
      <div className="tone-violet grid grid-cols-[minmax(0,1fr)] gap-5">
        <HomeIntro roles={user.roles} userId={user.id} label="CRM" />
        {board ? (
          <section aria-labelledby="crm-lead" className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="crm-lead" className="text-sm font-semibold">
                Lead
              </h2>
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            </div>
            {board}
          </section>
        ) : null}
        <ShortcutSection roles={user.roles} primary={user.role} label="Modul CRM" />
      </div>
    );
  }

  return (
    <div className="tone-violet grid grid-cols-[minmax(0,1fr)] gap-4">
      <PageHeader
        title="CRM"
        description="Lead, tahap, dan aktivitas marketing."
        actions={actions}
      />
      {board}
    </div>
  );
}
