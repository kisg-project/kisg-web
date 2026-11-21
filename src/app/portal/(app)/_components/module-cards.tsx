import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export interface PortalModule {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** false: modul belum dibangun, tampil sebagai kartu nonaktif. */
  ready: boolean;
}

/**
 * Kartu modul di beranda portal, bergaya ubin peluncur aplikasi: ikon di atas, judul, dan keterangan
 * singkat. Dua kolom mulai lebar 420px, target sentuh besar.
 */
export function ModuleCards({
  label,
  modules,
}: {
  label: string;
  modules: readonly PortalModule[];
}) {
  return (
    <ul aria-label={label} className="grid gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <li key={module.title}>
          {module.ready ? (
            <Link
              href={module.href}
              className="group relative flex h-full flex-col gap-3 rounded-3xl bg-card p-4 shadow-[0_16px_36px_-28px_rgb(1_60_52/0.55)] ring-1 ring-primary-100/70 transition-[translate,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] sm:p-5"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition-colors duration-200 group-hover:bg-primary-900 group-hover:text-white">
                <module.icon aria-hidden="true" className="size-[1.35rem]" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-primary-950">{module.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                  {module.description}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="absolute top-4 right-4 size-5 text-primary-400 transition-colors group-hover:text-primary-800"
              />
            </Link>
          ) : (
            <div className="flex h-full flex-col gap-3 rounded-3xl border border-dashed border-primary-200 bg-background p-4 sm:p-5">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-subtle-foreground ring-1 ring-primary-100">
                <module.icon aria-hidden="true" className="size-[1.35rem]" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{module.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                  {module.description}
                </span>
                <span className="mt-2 inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-800">
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
