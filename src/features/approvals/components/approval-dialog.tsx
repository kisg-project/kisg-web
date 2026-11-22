"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/browser";
import { FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { PasswordField } from "@/components/shared/password-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovalDecision, ApprovalDocType } from "@/config/approvals";
import { signatureOptionsAction } from "../actions/signature";
import {
  Cancel01Icon,
  FingerPrintIcon,
  Key01Icon,
  SecurityBlockIcon,
  SecurityCheckIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export interface SignedDecision {
  method: "biometrik" | "cadangan";
  password?: string;
  response?: AuthenticationResponseJSON;
  note?: string;
  lat?: number;
  lng?: number;
}

async function grantedPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state !== "granted") return null;
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          resolve(null);
        },
        { timeout: 4000, maximumAge: 60_000 },
      );
    });
  } catch {
    return null;
  }
}

const COPY: Record<ApprovalDecision, { trigger: string; title: string; submit: string }> = {
  disetujui: { trigger: "Setujui", title: "Setujui pengajuan", submit: "Setujui" },
  ditolak: { trigger: "Tolak", title: "Tolak pengajuan", submit: "Tolak" },
};

export function ApprovalDialog({
  decision,
  docType,
  docId,
  fingerprint,
  summary,
  pending,
  serverError,
  fieldErrors,
  onSign,
  open,
  onOpenChange,
}: {
  decision: ApprovalDecision;
  docType: ApprovalDocType;
  docId: string;
  fingerprint: boolean;
  summary: ReactNode;
  pending: boolean;
  serverError?: string;
  fieldErrors?: { password?: string; note?: string };
  onSign: (signed: SignedDecision) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const copy = COPY[decision];
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [deviceError, setDeviceError] = useState<string>();
  const [backup, setBackup] = useState(false);
  const options = useAction(signatureOptionsAction);
  const busy = pending || working;
  const noteError = fieldErrors?.note;

  async function sign() {
    setDeviceError(undefined);
    setWorking(true);
    try {
      const position = await grantedPosition();
      const base = { note: note.trim() || undefined, ...(position ?? {}) };
      if (backup) {
        onSign({ method: "cadangan", password, ...base });
        return;
      }
      if (!browserSupportsWebAuthn()) {
        setDeviceError("Perangkat ini belum mendukung sidik jari. Pakai password.");
        return;
      }
      const prepared = await options.executeAsync({ docType, docId, decision });
      if (!prepared.data) {
        setDeviceError(prepared.serverError ?? "Perangkat belum siap. Ulangi sekali lagi.");
        return;
      }
      const response = await startAuthentication({ optionsJSON: prepared.data.options });
      onSign({ method: "biometrik", response, ...base });
    } catch (caught) {
      setDeviceError(
        caught instanceof Error && caught.name === "NotAllowedError"
          ? "Sidik jari dibatalkan."
          : "Sidik jari belum terbaca. Ulangi sekali lagi.",
      );
    } finally {
      setWorking(false);
    }
  }

  if (!fingerprint) {
    return (
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        icon={FingerPrintIcon}
        tone="primary"
        title="Daftarkan sidik jari dulu"
        description="Persetujuan wajib memakai sidik jari yang terdaftar."
        trigger={
          <Button
            type="button"
            variant={decision === "disetujui" ? "save" : "cancel"}
            size="lg"
            className="min-h-11 flex-1"
          >
            <Icon icon={decision === "disetujui" ? Tick02Icon : Cancel01Icon} />
            {copy.trigger}
          </Button>
        }
      >
        <div className="grid gap-3 pb-4">
          <p className="text-sm text-muted-foreground">
            Sidik jari didaftarkan sekali di Akun saya, lalu dipakai untuk setiap persetujuan.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="cancel"
              size="lg"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Batal
            </Button>
            <Button asChild variant="save" size="lg">
              <Link href="/portal/akun#akun-sidik-jari">
                <Icon icon={FingerPrintIcon} />
                Daftar sekarang
              </Link>
            </Button>
          </div>
        </div>
      </FormDialog>
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPassword("");
          setDeviceError(undefined);
          setBackup(false);
        }
        onOpenChange(next);
      }}
      busy={busy}
      icon={decision === "disetujui" ? SecurityCheckIcon : SecurityBlockIcon}
      tone={decision === "disetujui" ? "primary" : "danger"}
      title={copy.title}
      description={backup ? "Konfirmasi dengan password." : "Konfirmasi dengan sidik jari."}
      trigger={
        <Button
          type="button"
          variant={decision === "disetujui" ? "save" : "cancel"}
          size="lg"
          className="min-h-11 flex-1"
        >
          {decision === "disetujui" ? (
            <Icon icon={Tick02Icon} aria-hidden="true" />
          ) : (
            <Icon icon={Cancel01Icon} aria-hidden="true" />
          )}
          {copy.trigger}
        </Button>
      }
    >
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) void sign();
        }}
      >
        <div className="grid gap-1 rounded-2xl bg-surface p-4 text-sm">{summary}</div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-catatan`}>
            {decision === "ditolak" ? "Alasan penolakan" : "Catatan (opsional)"}
          </Label>
          <Textarea
            id={`${id}-catatan`}
            rows={2}
            maxLength={500}
            value={note}
            aria-invalid={noteError ? true : undefined}
            aria-describedby={noteError ? `${id}-catatan-error` : undefined}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
          {noteError ? (
            <p id={`${id}-catatan-error`} className="text-sm text-destructive">
              {noteError}
            </p>
          ) : null}
        </div>
        {backup ? (
          <PasswordField
            label="Password akun Anda"
            autoComplete="current-password"
            value={password}
            error={fieldErrors?.password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        ) : null}
        {
          <button
            type="button"
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-full px-2 text-sm font-semibold text-primary hover:bg-primary-50 disabled:opacity-50"
            onClick={() => {
              setDeviceError(undefined);
              setBackup((value) => !value);
            }}
          >
            {backup ? (
              <Icon icon={FingerPrintIcon} aria-hidden="true" className="size-4" />
            ) : (
              <Icon icon={Key01Icon} aria-hidden="true" className="size-4" />
            )}
            {backup ? "Pakai sidik jari" : "Pakai password"}
          </button>
        }
        {(deviceError ?? serverError) ? (
          <p role="alert" className="text-sm text-destructive">
            {deviceError ?? serverError}
          </p>
        ) : null}
        <FormDialogFooter
          busy={busy}
          saveLabel={copy.submit}
          busyLabel={backup ? "Menyimpan" : "Menunggu sidik jari"}
          saveIcon={
            backup ? (
              <Icon icon={Key01Icon} aria-hidden="true" />
            ) : (
              <Icon icon={FingerPrintIcon} aria-hidden="true" />
            )
          }
          disabled={backup && !password}
          onCancel={() => {
            onOpenChange(false);
          }}
        />
      </form>
    </FormDialog>
  );
}
