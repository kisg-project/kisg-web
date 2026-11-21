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
              className="group flex h-full items-start gap-4 rounded-3xl bg-card p-5 shadow-[0_18px_40px_-30px_rgb(11_61_54/0.45)] ring-1 ring-foreground/5 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-700 group-hover:text-white">
                <module.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold group-hover:text-primary">{module.title}</span>
                <span className="block text-sm text-muted-foreground">{module.description}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-5 text-primary" />
            </Link>
          ) : (
            <div className="flex h-full items-start gap-4 rounded-3xl border border-dashed border-primary-200 bg-background/60 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-subtle-foreground">
                <module.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{module.title}</span>
                <span className="block text-sm text-muted-foreground">{module.description}</span>
                <span className="mt-2 inline-block rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-800">
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
