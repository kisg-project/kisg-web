import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { DEFAULT_RADIUS_M } from "@/config/attendance";
import { requirePortalUser } from "@/features/auth";
import { WorkLocationForm, listProjectOptions, listWorkLocations } from "@/features/attendance";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Titik absensi" };

/** Owner mengatur titik absensi (kantor atau proyek). Absen sah dalam radius titik yang aktif. */
export default async function WorkLocationsPage() {
  await requirePortalUser(["owner", "admin"]);
  const [locations, projects] = await Promise.all([listWorkLocations(), listProjectOptions()]);
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Titik absensi"
        description={`Karyawan hanya bisa absen dalam radius titik yang aktif. Radius default ${String(DEFAULT_RADIUS_M)} meter.`}
      />
      <section aria-labelledby="tambah-titik" className="app-card p-5 sm:p-6">
        <h2 id="tambah-titik" className="mb-4 text-lg font-bold">
          Tambah titik absensi
        </h2>
        <WorkLocationForm projects={projects} />
      </section>
      <section aria-labelledby="daftar-titik" className="grid gap-3">
        <h2 id="daftar-titik" className="text-lg font-bold">
          Semua titik
        </h2>
        {locations.length === 0 ? (
          <EmptyState
            title="Belum ada titik absensi."
            description="Tambahkan kantor atau lokasi proyek lewat form di atas."
          />
        ) : (
          <ul aria-label="Daftar titik absensi" className="grid gap-3">
            {locations.map((location) => (
              <li key={location.id} className="app-card p-4 sm:p-5">
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <MapPin aria-hidden="true" className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold break-words">{location.name}</span>
                        <span className="block text-sm text-subtle-foreground tabular-nums">
                          {location.kind === "proyek"
                            ? (location.projectName ?? "Proyek")
                            : "Kantor"}
                          , radius {location.radiusM} m
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          location.isActive
                            ? "bg-success-100 text-success-800"
                            : "bg-surface text-subtle-foreground",
                        )}
                      >
                        {location.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      <span className="text-sm font-semibold text-primary-700 group-open:hidden">
                        Ubah
                      </span>
                      <span className="hidden text-sm font-semibold text-primary-700 group-open:inline">
                        Tutup
                      </span>
                    </span>
                  </summary>
                  <div className="mt-4 border-t border-border pt-4">
                    <WorkLocationForm
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
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
