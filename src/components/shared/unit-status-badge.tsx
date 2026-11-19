import { UNIT_STATUS_META, type UnitStatus } from "@/config/units";
import { cn } from "@/lib/utils";

// Badge status unit: teks 800 di latar 100 (kontras 7.57:1 sampai 8.41:1, docs/brand.md).
const TONE_CLASSES = {
  success: "bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-200",
  warning: "bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-200",
  info: "bg-info-100 text-info-800 dark:bg-info-950 dark:text-info-200",
  danger: "bg-danger-100 text-danger-800 dark:bg-danger-950 dark:text-danger-200",
} as const;

export function UnitStatusBadge({ status, className }: { status: UnitStatus; className?: string }) {
  const meta = UNIT_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
