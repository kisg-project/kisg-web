import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./container";

interface SectionProps extends Omit<ComponentProps<"section">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Latar surface (abu muda) untuk section selang-seling. */
  tone?: "default" | "surface";
}

/** Section halaman dengan judul opsional dan garis aksen emas pendek di bawah judul. */
export function Section({
  title,
  description,
  tone = "default",
  className,
  children,
  ...props
}: SectionProps) {
  const headingId = props.id ? `${props.id}-judul` : undefined;
  return (
    <section
      aria-labelledby={title && headingId ? headingId : undefined}
      className={cn(
        "py-12 sm:py-16 lg:py-20",
        tone === "surface" && "bg-surface text-surface-foreground",
        className,
      )}
      {...props}
    >
      <Container>
        {title ? (
          <header className="mb-8 max-w-3xl sm:mb-10">
            <h2 id={headingId} className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>
            <span aria-hidden="true" className="mt-3 block h-1 w-12 rounded-sm bg-highlight" />
            {description ? (
              <p
                className={cn(
                  "mt-4 text-base sm:text-lg",
                  tone === "surface" ? "text-subtle-foreground" : "text-muted-foreground",
                )}
              >
                {description}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
