import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./container";

interface SectionProps extends Omit<ComponentProps<"section">, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Latar surface (mint muda) untuk section selang-seling. */
  tone?: "default" | "surface";
  /** Elemen di sisi kanan judul di layar lebar, misal tautan "Semua berita". */
  action?: ReactNode;
}

/** Section halaman dengan judul opsional. Hierarki lewat ukuran dan ketebalan huruf, tanpa hiasan. */
export function Section({
  title,
  description,
  tone = "default",
  action,
  className,
  children,
  ...props
}: SectionProps) {
  const headingId = props.id ? `${props.id}-judul` : undefined;
  return (
    <section
      aria-labelledby={title && headingId ? headingId : undefined}
      className={cn(
        "py-14 sm:py-20 lg:py-24",
        tone === "surface" && "bg-surface text-surface-foreground",
        className,
      )}
      {...props}
    >
      <Container>
        {title ? (
          <header className="mb-8 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h2
                id={headingId}
                className="text-3xl font-extrabold tracking-tight text-balance text-primary-950 sm:text-4xl"
              >
                {title}
              </h2>
              {description ? (
                <p
                  className={cn(
                    "mt-3 text-base sm:text-lg",
                    tone === "surface" ? "text-subtle-foreground" : "text-muted-foreground",
                  )}
                >
                  {description}
                </p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
