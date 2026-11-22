"use client";

import { useId, useState, type ReactNode } from "react";
import { FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { PasswordField } from "@/components/shared/password-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovalDecision } from "@/config/approvals";
import {
  Cancel01Icon,
  PencilEdit01Icon,
  SecurityBlockIcon,
  SecurityCheckIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export interface SignedDecision {
  password: string;
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
  summary,
  pending,
  serverError,
  fieldErrors,
  onSign,
  open,
  onOpenChange,
}: {
  decision: ApprovalDecision;
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
  const [locating, setLocating] = useState(false);
  const busy = pending || locating;
  const noteError = fieldErrors?.note;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPassword("");
        onOpenChange(next);
      }}
      busy={busy}
      icon={decision === "disetujui" ? SecurityCheckIcon : SecurityBlockIcon}
      tone={decision === "disetujui" ? "primary" : "danger"}
      title={copy.title}
      description="Periksa ringkasan, lalu tanda tangani dengan password akun Anda."
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
          if (busy) return;
          setLocating(true);
          void grantedPosition().then((position) => {
            setLocating(false);
            onSign({ password, note: note.trim() || undefined, ...(position ?? {}) });
          });
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
        <PasswordField
          label="Password akun Anda"
          autoComplete="current-password"
          value={password}
          error={fieldErrors?.password}
          hint="Password menjadi tanda tangan elektronik Anda untuk keputusan ini."
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
        {serverError ? (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        ) : null}
        <FormDialogFooter
          busy={busy}
          saveLabel={copy.submit}
          saveIcon={<Icon icon={PencilEdit01Icon} aria-hidden="true" />}
          onCancel={() => {
            onOpenChange(false);
          }}
        />
      </form>
    </FormDialog>
  );
}
