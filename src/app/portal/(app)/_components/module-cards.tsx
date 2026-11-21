import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export interface PortalModule {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** false: modul belum dibangun, tampil sebagai kartu nonaktif. */
  ready: boolean;
}

/** Kartu modul di beranda portal. Satu tugas per kartu, target sentuh besar. */
export function ModuleCards({
  label,
  modules,
}: {
  label: string;
  modules: readonly PortalModule[];
}) {
  return (
    <ul aria-label={label} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <li key={module.title}>
          {module.ready ? (
            <Link
              href={module.href}
              className="group flex h-full lift items-start gap-4 rounded-lg border bg-card p-5"
            >
              <span className="icon-chip flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                <module.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold group-hover:text-primary">{module.title}</span>
                <span className="block text-sm text-muted-foreground">{module.description}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-5 text-primary" />
            </Link>
          ) : (
            <div className="flex h-full items-start gap-4 rounded-lg border border-dashed p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface text-muted-foreground">
                <module.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{module.title}</span>
                <span className="block text-sm text-muted-foreground">{module.description}</span>
                <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                  Segera tersedia
                </span>
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
