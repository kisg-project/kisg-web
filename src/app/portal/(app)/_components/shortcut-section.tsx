import { featuresFor } from "@/config/portal-nav";
import type { AppRole } from "@/config/roles";
import { arrangeShortcuts, ShortcutEditor } from "@/features/shortcuts";
import { getShortcutPrefs } from "@/features/shortcuts/server";
import { ModuleCards } from "./module-cards";

export async function ShortcutSection({
  roles,
  primary,
  label,
}: {
  roles: readonly AppRole[];
  primary: AppRole;
  label: string;
}) {
  const arranged = arrangeShortcuts(featuresFor(roles, primary), await getShortcutPrefs());
  return (
    <section aria-labelledby="fitur" className="grid gap-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 id="fitur" className="text-sm font-semibold">
          Fitur
        </h2>
        <ShortcutEditor
          initial={arranged.map(({ item, visible }) => ({
            href: item.href,
            label: item.label,
            icon: item.icon,
            visible,
          }))}
        />
      </div>
      <ModuleCards
        label={label}
        modules={arranged.filter((entry) => entry.visible).map((entry) => entry.item)}
      />
    </section>
  );
}
