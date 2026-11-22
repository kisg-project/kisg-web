import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import type { NavFeature, ShortcutTone } from "@/config/portal-nav";
import { cn } from "@/lib/utils";

const TONE: Record<ShortcutTone, string> = {
  green: "bg-primary-100 text-primary-800 ring-primary-200",
  violet: "bg-violet-100 text-violet-700 ring-violet-200",
  orange: "bg-orange-100 text-orange-700 ring-orange-200",
  blue: "bg-info-100 text-info-700 ring-info-200",
  red: "bg-danger-100 text-danger-700 ring-danger-200",
  amber: "bg-warning-100 text-warning-800 ring-warning-200",
  gold: "bg-gold-100 text-gold-800 ring-gold-200",
};

export function ModuleCards({
  label,
  modules,
  className,
}: {
  label: string;
  modules: readonly NavFeature[];
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "grid grid-cols-4 gap-x-2 gap-y-4 rounded-xl border border-(--line-strong) bg-(--band-soft) p-4 sm:grid-cols-6",
        className,
      )}
    >
      {modules.map((module) => {
        const body = (
          <>
            <span
              className={cn(
                "relative flex size-12 items-center justify-center rounded-full ring-1 transition-transform",
                TONE[module.tone],
                module.ready ? "group-active:scale-95" : "opacity-55",
              )}
            >
              <Icon icon={module.icon} className="size-[1.375rem]" />
              {module.ready ? null : (
                <span className="absolute -top-1.5 -right-2.5 rounded-full border border-(--line-strong) bg-card px-1.5 text-[0.5625rem] font-semibold text-muted-foreground">
                  Segera
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-center text-[0.6875rem] leading-tight font-medium">
              {module.label}
            </span>
          </>
        );
        return (
          <li key={module.label} className="flex justify-center">
            {module.ready ? (
              <Link href={module.href} className="group flex w-full flex-col items-center gap-1.5">
                {body}
              </Link>
            ) : (
              <div aria-disabled="true" className="flex w-full flex-col items-center gap-1.5">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
