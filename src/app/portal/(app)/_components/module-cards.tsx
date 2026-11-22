import Link from "next/link";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export type ShortcutTone = "green" | "violet" | "orange" | "blue" | "red" | "amber" | "gold";

export interface PortalModule {
  href: string;
  title: string;
  icon: AppIcon;
  tone: ShortcutTone;
  ready: boolean;
}

const TONE: Record<ShortcutTone, string> = {
  green: "bg-primary-100 text-primary-800",
  violet: "bg-violet-100 text-violet-700",
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-info-100 text-info-700",
  red: "bg-danger-100 text-danger-700",
  amber: "bg-warning-100 text-warning-800",
  gold: "bg-gold-100 text-gold-800",
};

export function ModuleCards({
  label,
  modules,
}: {
  label: string;
  modules: readonly PortalModule[];
}) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-4 gap-x-2 gap-y-4 rounded-2xl border border-(--line-strong) bg-card p-4 sm:grid-cols-6 lg:grid-cols-8"
    >
      {modules.map((module) => {
        const body = (
          <>
            <span
              className={cn(
                "relative flex size-13 items-center justify-center rounded-2xl transition-transform",
                TONE[module.tone],
                module.ready ? "group-active:scale-95" : "opacity-55",
              )}
            >
              <Icon icon={module.icon} className="size-6" />
              {module.ready ? null : (
                <span className="absolute -top-1.5 -right-2 rounded-full border border-(--line-strong) bg-card px-1.5 text-[0.6rem] font-semibold text-muted-foreground">
                  Segera
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-center text-xs leading-tight font-medium">
              {module.title}
            </span>
          </>
        );
        return (
          <li key={module.title} className="flex justify-center">
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
