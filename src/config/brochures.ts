/**
 * Brosur PDF per proyek (keputusan owner, 22 November 2026): diunduh setelah form singkat, supaya
 * setiap unduhan tercatat sebagai lead. File di public/brosur/ dengan akhiran hash isi (cache aman),
 * tidak diindeks mesin pencari (robots.txt dan header X-Robots-Tag).
 */
export const BROCHURES: Readonly<Record<string, string>> = {
  "sejahtera-green-village": "/brosur/sejahtera-green-village-a9f5e2b1.pdf",
};

export function brochureFor(projectSlug: string | null | undefined): string | null {
  return projectSlug ? (BROCHURES[projectSlug] ?? null) : null;
}
