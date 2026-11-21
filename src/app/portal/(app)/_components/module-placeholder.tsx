import { Construction } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { PORTAL_AREAS, ROLE_HOME } from "@/config/portal";
import { requirePortalUser } from "@/features/auth";
import { PortalGreeting } from "./portal-greeting";

/**
 * Kerangka modul yang belum dibangun. Role dicek ulang dari database (proxy.ts membaca JWT, yang
 * bisa tertinggal beberapa menit setelah role diubah).
 */
export async function ModulePlaceholder({ prefix, phase }: { prefix: string; phase: string }) {
  const area = PORTAL_AREAS.find((item) => item.prefix === prefix);
  if (!area) throw new Error(`Area portal tidak dikenal: ${prefix}`);
  const user = await requirePortalUser(area.roles);
  // Beranda role (halaman pertama setelah login) memakai sapaan sesuai jam sebagai judul halaman.
  const isHome = ROLE_HOME[user.role] === prefix;
  return (
    <div className="grid gap-6">
      {isHome ? (
        <>
          <PortalGreeting fullName={user.fullName} roles={user.roles} />
          <h2 className="text-xl font-bold">{area.label}</h2>
        </>
      ) : (
        <PageHeader title={area.label} description={`Masuk sebagai ${user.fullName}.`} />
      )}
      <EmptyState
        icon={Construction}
        title="Modul ini belum tersedia."
        description={`Modul ${area.label} dibangun di ${phase}.`}
      />
    </div>
  );
}
