import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export type AppIcon = IconSvgElement;

export function Icon({
  icon,
  className,
  strokeWidth = 1.8,
}: {
  icon: AppIcon;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      aria-hidden="true"
      strokeWidth={strokeWidth}
      className={cn("size-5 shrink-0", className)}
    />
  );
}
