import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Tombol atau aksi di sisi kanan (desktop) atau di bawah judul (HP). */
  actions?: ReactNode;
  /** Halaman induk. Kalau diisi, tombol kembali bulat tampil di kiri judul, seperti aplikasi. */
  backHref?: string;
  /** Nama tombol kembali untuk pembaca layar, misal "Kembali ke beranda". */
  backLabel?: string;
  className?: string;
}

/** Judul halaman (h1) gaya aplikasi: judul besar, deskripsi singkat, aksi, dan tombol kembali. */
export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Kembali",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary-900 shadow-xs ring-1 ring-primary-100 transition-colors hover:bg-primary-50 motion-safe:active:scale-95"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance text-primary-950 sm:text-4xl">
            {title}
          </h1>
          {description ? <p className="mt-1.5 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
