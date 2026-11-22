import type { Metadata } from "next";
import { Location01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { DEFAULT_RADIUS_M } from "@/config/attendance";
import { WorkLocationDialog, listProjectOptions, listWorkLocations } from "@/features/attendance";
import { requirePortalUser } from "@/features/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Titik absensi" };

export default async function WorkLocationsPage() {
  await requirePortalUser(["owner", "admin"]);
  const [locations, projects] = await Promise.all([listWorkLocations(), listProjectOptions()]);
  return (
    <div className="tone-blue grid gap-4">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke beranda"
        title="Titik absensi"
        description={`Radius default ${String(DEFAULT_RADIUS_M)} meter`}
        actions={<WorkLocationDialog projects={projects} />}
      />
      <section aria-labelledby="daftar-titik" className="grid gap-3">
        <h2 id="daftar-titik" className="text-sm font-semibold">
          Semua titik
        </h2>
        {locations.length === 0 ? (
          <EmptyState title="Belum ada titik absensi" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-(--line-strong) bg-card">
            <div
              aria-hidden="true"
              className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_7rem_7rem_4rem] items-center gap-4 border-b border-(--line-strong) bg-(--band-soft) px-4 py-2.5 text-xs font-medium text-neutral-700 lg:grid dark:text-neutral-300"
            >
              <span>Nama titik</span>
              <span>Jenis</span>
              <span className="text-right">Radius</span>
              <span className="text-center">Status</span>
              <span className="text-right">Aksi</span>
            </div>
            <ul aria-label="Daftar titik absensi" className="divide-y divide-(--line-soft)">
              {locations.map((location) => (
                <li
                  key={location.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_7rem_7rem_4rem] lg:gap-4"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info-100 text-info-700 ring-1 ring-info-200">
                      <Icon icon={Location01Icon} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8125rem] font-semibold">
                        {location.name}
                      </span>
                      <span className="block text-xs text-muted-foreground tabular-nums lg:hidden">
                        {location.kind === "proyek" ? (location.projectName ?? "Proyek") : "Kantor"}
                        , radius {location.radiusM} m
                      </span>
                    </span>
                  </span>
                  <span className="hidden truncate text-xs lg:block">
                    {location.kind === "proyek" ? (location.projectName ?? "Proyek") : "Kantor"}
                  </span>
                  <span className="hidden text-right text-xs tabular-nums lg:block">
                    {location.radiusM} m
                  </span>
                  <span
                    className={cn(
                      "hidden w-fit items-center gap-1.5 justify-self-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold lg:inline-flex",
                      location.isActive
                        ? "bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-200"
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        location.isActive ? "bg-success-600" : "bg-neutral-500",
                      )}
                    />
                    {location.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold lg:hidden",
                        location.isActive
                          ? "bg-success-50 text-success-800"
                          : "bg-neutral-100 text-neutral-700",
                      )}
                    >
                      {location.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <WorkLocationDialog
                      projects={projects}
                      initial={{
                        id: location.id,
                        name: location.name,
                        kind: location.kind,
                        projectId: location.projectId,
                        lat: location.lat,
                        lng: location.lng,
                        radiusM: location.radiusM,
                        isActive: location.isActive,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
