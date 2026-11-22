"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ATTENDANCE_KIND_LABEL,
  MAX_GPS_ACCURACY_M,
  type AttendanceKind,
} from "@/config/attendance";
import { cn } from "@/lib/utils";
import { clockAction, requestExceptionAction } from "../actions/attendance";
import { FaceCapture } from "./face-capture";
import {
  CheckmarkCircle02Icon,
  Loading03Icon,
  Location01Icon,
  LocationOffline01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

interface Position {
  lat: number;
  lng: number;
  accuracy: number;
}

type GeoState =
  | { status: "mencari" }
  | { status: "ditolak" }
  | { status: "tidak_didukung" }
  | { status: "siap"; position: Position };

const noSubscribe = () => () => undefined;

function useGeolocation(): GeoState {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => "geolocation" in navigator,
    () => true,
  );
  const [state, setState] = useState<GeoState>({ status: "mencari" });
  useEffect(() => {
    if (!supported) return;
    const id = navigator.geolocation.watchPosition(
      (result) => {
        setState({
          status: "siap",
          position: {
            lat: result.coords.latitude,
            lng: result.coords.longitude,
            accuracy: result.coords.accuracy,
          },
        });
      },
      (error) => {
        setState({ status: error.code === error.PERMISSION_DENIED ? "ditolak" : "mencari" });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );
    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [supported]);
  return supported ? state : { status: "tidak_didukung" };
}

function photoUploadUrl(): string {
  return window.location.pathname.startsWith("/portal") ? "/portal/absensi/foto" : "/absensi/foto";
}

async function uploadSelfie(file: File, kind: AttendanceKind): Promise<string> {
  const body = new FormData();
  body.set("foto", file);
  body.set("jenis", kind);
  const response = await fetch(photoUploadUrl(), { method: "POST", body });
  const result = (await response.json().catch(() => null)) as
    { ok: true; path: string } | { ok: false; message: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? "Foto gagal diunggah. Coba lagi.");
  return result.path;
}

function timeWib(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ClockFlow({
  kind,
  homeHref,
  nextHref,
}: {
  kind: AttendanceKind;
  homeHref: string;
  nextHref: string;
}) {
  const geo = useGeolocation();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reason, setReason] = useState("");
  const clock = useAction(clockAction);
  const exception = useAction(requestExceptionAction);
  const label = ATTENDANCE_KIND_LABEL[kind];

  const position = geo.status === "siap" ? geo.position : null;
  const accurate = position ? position.accuracy <= MAX_GPS_ACCURACY_M : false;

  const onCaptured = useCallback((file: File) => {
    setPhoto(file);
    setPhotoPath(null);
    setUploadError(null);
  }, []);

  async function submit() {
    if (!position || !photo) return;
    setUploading(true);
    setUploadError(null);
    try {
      const path = photoPath ?? (await uploadSelfie(photo, kind));
      setPhotoPath(path);
      clock.execute({ kind, ...position, photoPath: path });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Foto gagal diunggah.");
    } finally {
      setUploading(false);
    }
  }

  const result = clock.result.data;
  if (exception.result.data) {
    return (
      <div role="status" className="grid gap-4 rounded-3xl bg-warning-50 p-5 text-center">
        <p className="text-lg font-bold">Pengajuan terkirim</p>
        <p className="text-sm text-subtle-foreground">
          {label} di luar lokasi menunggu persetujuan owner atau manajer Anda.
        </p>
        <Button asChild>
          <Link href={homeHref}>Kembali ke absensi</Link>
        </Button>
      </div>
    );
  }
  if (result?.status === "ok") {
    const late = kind === "masuk" ? result.late_minutes : result.early_minutes;
    return (
      <div role="status" className="grid gap-4 rounded-3xl bg-success-50 p-5 text-center">
        <Icon
          icon={CheckmarkCircle02Icon}
          aria-hidden="true"
          className="mx-auto size-12 text-success-600"
        />
        <p className="text-lg font-bold">
          {label} tercatat pukul {timeWib(new Date())}
        </p>
        <p className="text-sm text-subtle-foreground">
          {result.locationName ?? "Titik absensi"}, {String(result.distance_m)} m dari titik.
          {late > 0
            ? kind === "masuk"
              ? ` Terlambat ${String(late)} menit.`
              : ` Pulang ${String(late)} menit lebih awal.`
            : ""}
        </p>
        <Button asChild size="lg">
          <Link href={nextHref}>Lanjut</Link>
        </Button>
      </div>
    );
  }

  const outside = result?.status === "di_luar_radius" ? result : null;
  const busy = uploading || clock.isExecuting;

  return (
    <div className="grid gap-6">
      <section aria-labelledby="langkah-lokasi" className="grid gap-2 app-card p-4 sm:p-5">
        <h2 id="langkah-lokasi" className="flex items-center gap-2 font-bold">
          {position && accurate ? (
            <Icon icon={Location01Icon} aria-hidden="true" className="size-5 text-success-600" />
          ) : (
            <Icon
              icon={LocationOffline01Icon}
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          )}
          1. Lokasi
        </h2>
        <p role="status" aria-live="polite" className="text-sm">
          {geo.status === "mencari" ? "Mencari lokasi GPS" : null}
          {geo.status === "ditolak"
            ? "Izinkan akses lokasi di browser, lalu muat ulang halaman."
            : null}
          {geo.status === "tidak_didukung" ? "Browser ini tidak mendukung lokasi GPS." : null}
          {position
            ? accurate
              ? `Lokasi ditemukan (akurasi ${String(Math.round(position.accuracy))} m).`
              : `Akurasi GPS ${String(Math.round(position.accuracy))} m. Tunggu sebentar atau pindah ke tempat terbuka.`
            : null}
        </p>
      </section>

      <section aria-labelledby="langkah-wajah" className="grid gap-3 app-card p-4 sm:p-5">
        <h2 id="langkah-wajah" className="font-bold">
          2. Foto wajah
        </h2>
        <FaceCapture onCaptured={onCaptured} />
      </section>

      {outside ? (
        <section
          aria-labelledby="di-luar-lokasi"
          className="grid gap-3 rounded-3xl border border-warning-300 bg-warning-50 p-4 sm:p-5"
        >
          <h2 id="di-luar-lokasi" className="font-bold">
            Anda di luar radius absensi
          </h2>
          <p className="text-sm">
            Titik terdekat {result?.locationName ?? ""} berjarak {String(outside.distance_m)} m.
            Batas {String(outside.radius_m)} m. Kalau sedang bertugas di luar, ajukan absen di luar
            lokasi.
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="alasan-luar-lokasi">Alasan</Label>
            <Textarea
              id="alasan-luar-lokasi"
              rows={3}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
            />
            {exception.result.validationErrors?.reason?._errors?.[0] ? (
              <p className="text-sm text-destructive">
                {exception.result.validationErrors.reason._errors[0]}
              </p>
            ) : null}
          </div>
          {exception.result.serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {exception.result.serverError}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={exception.isExecuting || !position || !photoPath}
            onClick={() => {
              if (position && photoPath) {
                exception.execute({ kind, ...position, photoPath, reason });
              }
            }}
          >
            <Icon icon={SentIcon} aria-hidden="true" />
            {exception.isExecuting ? "Mengirim" : "Ajukan absen di luar lokasi"}
          </Button>
        </section>
      ) : null}

      {(uploadError ?? clock.result.serverError) ? (
        <p role="alert" className="text-sm text-destructive">
          {uploadError ?? clock.result.serverError}
        </p>
      ) : null}

      {outside ? null : (
        <Button
          type="button"
          size="lg"
          className={cn("w-full")}
          disabled={!position || !accurate || !photo || busy}
          onClick={() => {
            void submit();
          }}
        >
          {busy ? <Icon icon={Loading03Icon} aria-hidden="true" className="animate-spin" /> : null}
          {busy ? "Mengirim" : `Kirim ${label.toLowerCase()}`}
        </Button>
      )}
    </div>
  );
}
