import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { DEFAULT_RADIUS_M } from "@/config/attendance";
import { requirePortalUser } from "@/features/auth";
import { WorkLocationDialog, listProjectOptions, listWorkLocations } from "@/features/attendance";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Titik absensi" };

/**
 * Owner mengatur titik absensi (kantor atau proyek). Tambah dan ubah lewat dialog (lembar bawah di HP).
 * Absen sah dalam radius titik yang aktif.
 */
export default async function WorkLocationsPage() {
  await requirePortalUser(["owner", "admin"]);
  const [locations, projects] = await Promise.all([listWorkLocations(), listProjectOptions()]);
  return (
    <div className="grid gap-6">
      <PageHeader
        backHref="/portal/owner"
        backLabel="Kembali ke beranda"
        title="Titik absensi"
        description={`Karyawan hanya bisa absen dalam radius titik yang aktif. Radius default ${String(DEFAULT_RADIUS_M)} meter.`}
      />
      <div>
        <WorkLocationDialog projects={projects} />
      </div>
      <section aria-labelledby="daftar-titik" className="grid gap-3">
        <h2 id="daftar-titik" className="text-lg font-bold">
          Semua titik
        </h2>
        {locations.length === 0 ? (
          <EmptyState
            title="Belum ada titik absensi"
            description="Tambahkan kantor atau lokasi proyek dengan tombol Tambah titik absensi."
          />
        ) : (
          <ul aria-label="Daftar titik absensi" className="grid gap-3 lg:grid-cols-2">
            {locations.map((location) => (
              <li
                key={location.id}
                className="flex flex-wrap items-center justify-between gap-3 app-card p-4 sm:p-5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-white">
                    <MapPin aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold break-words">{location.name}</span>
                    <span className="block text-sm text-subtle-foreground tabular-nums">
                      {location.kind === "proyek" ? (location.projectName ?? "Proyek") : "Kantor"},
                      radius {location.radiusM} m
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-1">
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
        )}
      </section>
    </div>
  );
}
