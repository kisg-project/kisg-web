import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Kembali",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-(--line-strong) bg-neutral-100 px-4 py-3.5 lg:-mx-6 lg:px-6 dark:bg-neutral-900",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-(--line-strong) bg-card transition-colors hover:bg-neutral-50 motion-safe:active:scale-95 dark:hover:bg-neutral-800"
          >
            <Icon icon={ArrowLeft01Icon} className="size-[1.125rem]" />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-base leading-tight font-semibold tracking-tight sm:text-lg">
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
