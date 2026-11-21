import { cn } from "@/lib/utils";

/** Inisial dua huruf dari nama, untuk avatar tanpa foto. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "K";
}

/**
 * Foto profil bulat. Memakai <img> biasa karena sumbernya signed URL Supabase yang berganti per
 * request (tidak cocok untuk optimasi next/image). Tanpa foto: inisial nama.
 */
export function Avatar({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-800",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL privat berumur pendek, tidak lewat optimasi gambar
        <img src={src} alt={`Foto profil ${name}`} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
