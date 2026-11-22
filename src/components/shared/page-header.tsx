import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: AppIcon;
  tone?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Kembali",
  icon,
  tone = "bg-primary-100 text-primary-800",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-(--line-strong) bg-neutral-100 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-(--line-strong) bg-card transition-colors hover:bg-neutral-50 motion-safe:active:scale-95"
          >
            <Icon icon={ArrowLeft01Icon} className="size-[1.125rem]" />
          </Link>
        ) : null}
        {icon ? (
          <span
            className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone)}
          >
            <Icon icon={icon} className="size-[1.125rem]" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-lg leading-tight font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
