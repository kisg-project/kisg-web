"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BLINK_CLOSED,
  BLINK_OPEN,
  BLINK_TIMEOUT_MS,
  MIN_FACE_WIDTH_RATIO,
} from "@/config/attendance";
import { compressImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { Camera01Icon, Loading03Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

type Step =
  | "memuat"
  | "izin_ditolak"
  | "tanpa_wajah"
  | "banyak_wajah"
  | "terlalu_jauh"
  | "kedip"
  | "mengambil"
  | "selesai"
  | "gagal";

const GUIDE: Record<Step, string> = {
  memuat: "Menyiapkan kamera",
  izin_ditolak: "Izinkan akses kamera di browser, lalu coba lagi.",
  tanpa_wajah: "Arahkan wajah ke dalam bingkai.",
  banyak_wajah: "Pastikan hanya satu wajah di kamera.",
  terlalu_jauh: "Dekatkan wajah ke kamera.",
  kedip: "Berkedip sekali untuk mengambil foto.",
  mengambil: "Mengambil foto",
  selesai: "Foto siap.",
  gagal: "Kamera tidak bisa dipakai. Coba muat ulang halaman.",
};

const FACE_STUB = process.env.NEXT_PUBLIC_E2E_FACE_STUB === "1";

interface Landmarker {
  detectForVideo: (
    video: HTMLVideoElement,
    time: number,
  ) => {
    faceLandmarks: { x: number; y: number }[][];
    faceBlendshapes: { categories: { categoryName: string; score: number }[] }[];
  };
  close: () => void;
}

async function loadLandmarker(): Promise<Landmarker> {
  const vision = await import("@mediapipe/tasks-vision");
  const files = await vision.FilesetResolver.forVisionTasks("/vendor/mediapipe/wasm");
  return vision.FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: "/vendor/mediapipe/face_landmarker.task", delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 2,
    outputFaceBlendshapes: true,
  });
}

function blinkScore(categories: { categoryName: string; score: number }[]): number {
  const left = categories.find((item) => item.categoryName === "eyeBlinkLeft")?.score ?? 0;
  const right = categories.find((item) => item.categoryName === "eyeBlinkRight")?.score ?? 0;
  return Math.min(left, right);
}

export function FaceCapture({ onCaptured }: { onCaptured: (file: File, preview: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("memuat");
  const [preview, setPreview] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);

  const stop = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setStep("mengambil");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setStep("gagal");
      return;
    }
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    stop();
    if (!blob) {
      setStep("gagal");
      return;
    }
    const compressed = await compressImage(
      new File([blob], "selfie.jpg", { type: "image/jpeg" }),
      "attendance",
    );
    const url = URL.createObjectURL(compressed.file);
    setPreview(url);
    setStep("selesai");
    onCaptured(compressed.file, url);
  }, [onCaptured, stop]);

  useEffect(() => {
    const run = { cancelled: false };
    const isCancelled = () => run.cancelled;
    let landmarker: Landmarker | null = null;
    let frame = 0;

    async function start() {
      setStep("memuat");
      setPreview(null);
      setSlow(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (isCancelled()) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
      } catch (error) {
        setStep(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "izin_ditolak"
            : "gagal",
        );
        return;
      }

      if (FACE_STUB) {
        setStep("kedip");
        return;
      }

      try {
        landmarker = await loadLandmarker();
      } catch {
        setStep("gagal");
        return;
      }
      if (isCancelled()) return;

      let closedSeen = false;
      const startedAt = performance.now();
      const loop = () => {
        const video = videoRef.current;
        if (isCancelled() || !video || !landmarker) return;
        if (video.readyState >= 2) {
          const result = landmarker.detectForVideo(video, performance.now());
          const faces = result.faceLandmarks;
          const [face] = faces;
          if (faces.length === 0 || !face) {
            setStep("tanpa_wajah");
            closedSeen = false;
          } else if (faces.length > 1) {
            setStep("banyak_wajah");
            closedSeen = false;
          } else {
            const xs = face.map((point) => point.x);
            const width = Math.max(...xs) - Math.min(...xs);
            if (width < MIN_FACE_WIDTH_RATIO) {
              setStep("terlalu_jauh");
              closedSeen = false;
            } else {
              setStep("kedip");
              const score = blinkScore(result.faceBlendshapes[0]?.categories ?? []);
              if (score > BLINK_CLOSED) closedSeen = true;
              else if (closedSeen && score < BLINK_OPEN) {
                void capture();
                return;
              }
            }
          }
          if (performance.now() - startedAt > BLINK_TIMEOUT_MS) setSlow(true);
        }
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    void start();
    return () => {
      run.cancelled = true;
      cancelAnimationFrame(frame);
      landmarker?.close();
      stop();
    };
  }, [attempt, capture, stop]);

  const ready = step === "kedip";
  return (
    <div className="grid gap-3">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-primary-950">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau foto lokal (blob URL)
          <img src={preview} alt="Foto absensi yang diambil" className="size-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Tampilan kamera depan"
            className="size-full -scale-x-100 object-cover"
          />
        )}
        {preview ? null : (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-[12%] rounded-[50%] border-4 transition-colors",
              ready ? "border-success-400" : "border-white/70",
            )}
          />
        )}
        {step === "memuat" || step === "mengambil" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-primary-950/40">
            <Icon
              icon={Loading03Icon}
              aria-hidden="true"
              className="size-8 animate-spin text-white"
            />
          </span>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="text-center text-sm font-semibold">
        {GUIDE[step]}
      </p>
      {slow && step === "kedip" ? (
        <p className="text-center text-sm text-muted-foreground">
          Belum terdeteksi. Cari tempat yang lebih terang dan tatap kamera.
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        {FACE_STUB && ready ? (
          <Button
            type="button"
            onClick={() => {
              void capture();
            }}
          >
            <Icon icon={Camera01Icon} aria-hidden="true" />
            Ambil foto (mode uji)
          </Button>
        ) : null}
        {step === "selesai" || step === "izin_ditolak" || step === "gagal" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAttempt((value) => value + 1);
            }}
          >
            <Icon icon={RotateLeft01Icon} aria-hidden="true" />
            Ambil ulang
          </Button>
        ) : null}
      </div>
    </div>
  );
}
