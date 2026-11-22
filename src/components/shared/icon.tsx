import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export type AppIcon = IconSvgElement;

export function Icon({ className, strokeWidth = 1.8, size = 20, ...props }: HugeiconsIconProps) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      strokeWidth={strokeWidth}
      size={size}
      {...props}
      className={cn("shrink-0", className)}
    />
  );
}
