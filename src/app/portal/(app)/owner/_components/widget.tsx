import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export function WidgetLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="hit-44 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-(--line-strong) bg-card px-2.5 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
    >
      {children}
      <Icon icon={ArrowRight01Icon} className="arrow-nudge size-3.5" />
    </Link>
  );
}

export function Widget({
  id,
  title,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border border-(--line-strong) bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export const PILL = {
  green: "bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-200",
  orange: "bg-warning-50 text-warning-800 dark:bg-warning-950 dark:text-warning-200",
  red: "bg-danger-50 text-danger-700 dark:bg-neutral-900 dark:text-danger-300",
  gray: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  blue: "bg-info-50 text-info-800 dark:bg-info-950 dark:text-info-200",
  violet: "bg-violet-50 text-violet-700 dark:bg-neutral-900 dark:text-violet-200",
} as const;

const DOT = {
  green: "bg-success-600",
  orange: "bg-warning-500",
  red: "bg-danger-500",
  gray: "bg-neutral-500",
  blue: "bg-info-500",
  violet: "bg-violet-500",
} as const;

export function Pill({ tone, children }: { tone: keyof typeof PILL; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-current/15 px-2 py-0.5 text-[0.6875rem] font-semibold",
        PILL[tone],
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}
