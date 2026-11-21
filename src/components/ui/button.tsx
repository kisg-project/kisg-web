import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

// Disesuaikan dari shadcn (radix-nova) ke token brand:
// - hover primary memakai primary-hover (lebih gelap), bukan opacity, supaya kontras tetap 4.5:1 ke atas
// - varian "highlight" untuk CTA emas (teks gelap di gold-400, 7.54:1)
// - tinggi default 44px untuk target sentuh (CLAUDE.md bagian 6)
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent text-sm font-semibold whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        highlight: "bg-highlight text-highlight-foreground hover:bg-highlight-hover",
        outline:
          "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-danger-700",
        // Tombol dialog (keputusan owner, 22 November 2026): Simpan hijau, Batal merah, teks putih AA.
        save: "bg-success-700 text-white hover:bg-success-800",
        cancel: "bg-danger-600 text-white hover:bg-danger-700",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
