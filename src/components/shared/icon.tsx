import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export type AppIcon = IconSvgElement;

export function Icon({ className, strokeWidth = 1.8, ...props }: HugeiconsIconProps) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      strokeWidth={strokeWidth}
      {...props}
      className={cn("size-5 shrink-0", className)}
    />
  );
}
