"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { ConfirmDialog } from "@/components/shared/form-dialog";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { formatDateWIB } from "@/lib/format";
import { fingerprintOptionsAction, registerFingerprintAction } from "../actions/signature";
import { FingerPrintIcon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

function deviceLabel(): string {
  const agent = navigator.userAgent;
  if (/iPad/i.test(agent)) return "iPad";
  if (/iPhone/i.test(agent)) return "iPhone";
  if (/Android/i.test(agent)) return "HP Android";
  if (/Macintosh/i.test(agent)) return "Mac";
  if (/Windows/i.test(agent)) return "Windows";
  return "Perangkat lain";
}

function friendlyError(caught: unknown): string {
  if (caught instanceof Error && caught.name === "NotAllowedError")
    return "Pendaftaran dibatalkan.";
  if (caught instanceof Error && caught.name === "InvalidStateError") {
    return "Perangkat ini sudah terdaftar.";
  }
  return "Sidik jari belum terdaftar. Ulangi sekali lagi.";
}

export function FingerprintSetup({
  registered,
}: {
  registered: { deviceLabel: string | null; createdAt: string } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const options = useAction(fingerprintOptionsAction);
  const register = useAction(registerFingerprintAction);

  if (registered) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-success-50 p-4 text-success-900 dark:bg-success-950 dark:text-success-100">
        <Icon icon={SecurityCheckIcon} aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Sidik jari terdaftar</p>
          <p>
            {registered.deviceLabel ?? "Perangkat"}, {formatDateWIB(registered.createdAt)}. Reset
            hanya oleh Direktur Utama.
          </p>
        </div>
      </div>
    );
  }

  async function confirm() {
    setError(undefined);
    if (!browserSupportsWebAuthn()) {
      setError("Perangkat ini belum mendukung sidik jari.");
      return;
    }
    setBusy(true);
    try {
      const prepared = await options.executeAsync();
      if (!prepared.data) {
        setError(prepared.serverError ?? "Perangkat belum siap. Ulangi sekali lagi.");
        return;
      }
      const response = await startRegistration({ optionsJSON: prepared.data.options });
      const saved = await register.executeAsync({ response, deviceLabel: deviceLabel() });
      if (!saved.data) {
        setError(saved.serverError ?? "Sidik jari belum terdaftar. Ulangi sekali lagi.");
        return;
      }
      setOpen(false);
      toast.success("Sidik jari terdaftar.");
      router.refresh();
    } catch (caught) {
      setError(friendlyError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        setError(undefined);
        setOpen(next);
      }}
      title="Daftarkan sidik jari?"
      description="Hanya sekali. Ganti perangkat lewat Direktur Utama."
      confirmLabel="Daftarkan"
      busyLabel="Menunggu sidik jari"
      icon={FingerPrintIcon}
      tone="primary"
      busy={busy}
      error={error}
      onConfirm={() => {
        void confirm();
      }}
      trigger={
        <Button type="button" size="lg">
          <Icon icon={FingerPrintIcon} aria-hidden="true" />
          Daftarkan sidik jari
        </Button>
      }
    />
  );
}
