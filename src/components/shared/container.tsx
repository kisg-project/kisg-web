import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Wadah konten: maksimal 1280px, gutter 16px di HP, 24px di tablet, 32px di desktop. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}
