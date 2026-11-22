import Link from "next/link";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export type StatTone = "green" | "violet" | "orange" | "blue" | "red" | "amber";

const TONE: Record<StatTone, string> = {
  green: "bg-primary-100 text-primary-800",
  violet: "bg-violet-100 text-violet-700",
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-info-100 text-info-700",
  red: "bg-danger-100 text-danger-700",
  amber: "bg-warning-100 text-warning-800",
};

const BG: Record<StatTone, string> = {
  green: "bg-primary-50 dark:bg-primary-950",
  violet: "bg-violet-50 dark:bg-neutral-900",
  orange: "bg-orange-50 dark:bg-neutral-900",
  blue: "bg-info-50 dark:bg-info-950",
  red: "bg-danger-50 dark:bg-neutral-900",
  amber: "bg-warning-50 dark:bg-warning-950",
};

export function StatCard({
  icon,
  tone,
  label,
  value,
  href,
  hint,
}: {
  icon: AppIcon;
  tone: StatTone;
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-xl border border-(--line-strong)", BG[tone])}>
      <div className="flex flex-col items-start gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-current/25",
            TONE[tone],
          )}
        >
          <Icon icon={icon} className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl leading-tight font-semibold tabular-nums">{value}</span>
          <span className="block text-xs leading-snug text-muted-foreground">{label}</span>
        </span>
      </div>
      {href ? (
        <Link
          href={href}
          className="mx-3.5 flex min-h-10 items-center justify-between border-t border-dashed border-(--line-strong) text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          Lihat detail
          <Icon icon={ArrowUpRight01Icon} className="arrow-nudge-up size-4" />
        </Link>
      ) : hint ? (
        <p className="mx-3.5 flex min-h-10 items-center border-t border-dashed border-(--line-strong) text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
