"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { Crosshair, LoaderCircle, MapPin, Plus } from "lucide-react";
import { toast } from "@/components/shared/toast";
import { FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_RADIUS_M } from "@/config/attendance";
import { saveWorkLocationAction } from "../actions/attendance";
import { workLocationSchema, type WorkLocationInput } from "../schemas/attendance";

export interface ProjectChoice {
  id: string;
  name: string;
}

/**
 * Tambah atau ubah titik absensi. "Pakai lokasi saya sekarang" mengisi koordinat dari GPS HP owner
 * yang sedang berada di lokasi (keputusan owner, CLAUDE.md bagian 8).
 */
export function WorkLocationForm({
  projects,
  initial,
  onDone,
  onCancel,
}: {
  projects: readonly ProjectChoice[];
  initial?: WorkLocationInput & { id: string };
  onDone?: () => void;
  /** Diisi saat form tampil di dialog: footer Batal dan Simpan. */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const form = useForm<WorkLocationInput>({
    resolver: zodResolver(workLocationSchema),
    defaultValues: initial ?? {
      name: "",
      kind: "kantor",
      projectId: null,
      lat: undefined as unknown as number,
      lng: undefined as unknown as number,
      radiusM: DEFAULT_RADIUS_M,
      isActive: true,
    },
  });
  const key = initial?.id ?? "baru";
  const kind = useWatch({ control: form.control, name: "kind" });
  const { execute, result, isExecuting } = useAction(saveWorkLocationAction, {
    onSuccess() {
      toast.success(initial ? "Titik absensi diperbarui." : "Titik absensi ditambahkan.");
      if (!initial) form.reset();
      onDone?.();
      router.refresh();
    },
  });

  function fillMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError("Browser ini tidak mendukung lokasi GPS.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("lat", Number(position.coords.latitude.toFixed(6)), { shouldValidate: true });
        form.setValue("lng", Number(position.coords.longitude.toFixed(6)), {
          shouldValidate: true,
        });
        setLocating(false);
        toast.success(
          `Lokasi diambil (akurasi ${String(Math.round(position.coords.accuracy))} m).`,
        );
      },
      (error) => {
        setLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Izinkan akses lokasi di browser, lalu coba lagi."
            : "Lokasi belum didapat. Coba lagi di tempat terbuka.",
        );
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  }

  const numberField = (name: "lat" | "lng" | "radiusM") =>
    form.register(name, {
      setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
    });

  return (
    <form
      noValidate
      aria-label={initial ? `Ubah titik ${initial.name}` : "Tambah titik absensi"}
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute({ ...values, id: initial?.id });
        })(event);
      }}
    >
      <TextField
        label="Nama titik"
        placeholder="Contoh: Kantor pemasaran Bekasi"
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="kind"
          render={({ field }) => (
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`titik-jenis-${key}`}>Jenis</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`titik-jenis-${key}`} className="h-11 w-full rounded-md px-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="kantor" className="min-h-10">
                    Kantor
                  </SelectItem>
                  <SelectItem value="proyek" className="min-h-10">
                    Proyek
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
        {kind === "proyek" ? (
          <Controller
            control={form.control}
            name="projectId"
            render={({ field, fieldState }) => (
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor={`titik-proyek-${key}`}>Proyek</Label>
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={`titik-proyek-${key}`}
                    className="h-11 w-full rounded-md px-3"
                    aria-invalid={fieldState.error ? true : undefined}
                  >
                    <SelectValue placeholder="Pilih proyek" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="min-h-10">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Lintang"
          inputMode="decimal"
          error={form.formState.errors.lat?.message}
          {...numberField("lat")}
        />
        <TextField
          label="Bujur"
          inputMode="decimal"
          error={form.formState.errors.lng?.message}
          {...numberField("lng")}
        />
        <TextField
          label="Radius (meter)"
          inputMode="numeric"
          error={form.formState.errors.radiusM?.message}
          {...numberField("radiusM")}
        />
      </div>
      <div>
        <Button type="button" variant="outline" onClick={fillMyLocation} disabled={locating}>
          {locating ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Crosshair aria-hidden="true" />
          )}
          Pakai lokasi saya sekarang
        </Button>
        {geoError ? <p className="mt-2 text-sm text-destructive">{geoError}</p> : null}
      </div>
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox
              id={`titik-aktif-${key}`}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
              }}
              className="size-5"
            />
            <Label htmlFor={`titik-aktif-${key}`} className="font-normal">
              Aktif dipakai untuk absensi
            </Label>
          </div>
        )}
      />
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      {onCancel ? (
        <FormDialogFooter busy={isExecuting} onCancel={onCancel} />
      ) : (
        <div>
          <Button type="submit" disabled={isExecuting}>
            {isExecuting ? "Menyimpan" : "Simpan"}
          </Button>
        </div>
      )}
    </form>
  );
}

/** Tombol Tambah titik absensi atau Ubah, membuka form di dialog (lembar bawah di HP). */
export function WorkLocationDialog({
  projects,
  initial,
}: {
  projects: readonly ProjectChoice[];
  initial?: WorkLocationInput & { id: string };
}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title={initial ? `Ubah titik ${initial.name}` : "Tambah titik absensi"}
      description="Karyawan hanya bisa absen dalam radius titik yang aktif."
      icon={MapPin}
      trigger={
        initial ? (
          <Button
            type="button"
            variant="ghost"
            className="text-primary-700"
            aria-label={`Ubah titik ${initial.name}`}
          >
            Ubah
          </Button>
        ) : (
          <Button type="button" size="lg">
            <Plus aria-hidden="true" />
            Tambah titik absensi
          </Button>
        )
      }
    >
      <WorkLocationForm projects={projects} initial={initial} onDone={close} onCancel={close} />
    </FormDialog>
  );
}
