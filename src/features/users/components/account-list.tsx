"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Avatar } from "@/components/shared/avatar";
import { ConfirmDialog, FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isInvitableRole, ROLE_LABELS, type AppRole } from "@/config/roles";
import { formatDateWIB } from "@/lib/format";
import {
  cancelInviteAction,
  resendInviteAction,
  setUserActiveAction,
  setUserRolesAction,
} from "../actions/users";
import type { AccountStatus, PortalAccount } from "../queries/list";
import { manageProblem } from "../utils/rules";
import { InviteResultCard } from "./invite-form";
import { RolePicker, type RoleSelection } from "./role-picker";
import { MailRemove01Icon, SecurityCheckIcon, UserRemove01Icon } from "@hugeicons/core-free-icons";

const STATUS_LABEL: Record<AccountStatus, string> = {
  aktif: "Aktif",
  menunggu_aktivasi: "Menunggu aktivasi",
  nonaktif: "Nonaktif",
};

export function AccountList({
  accounts,
  actor,
}: {
  accounts: readonly PortalAccount[];
  actor: { id: string; roles: AppRole[] };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<PortalAccount | null>(null);
  const [confirming, setConfirming] = useState<{
    kind: "nonaktifkan" | "batalkan";
    account: PortalAccount;
  } | null>(null);
  const onSuccess = () => {
    setConfirming(null);
    router.refresh();
  };
  const activeAction = useAction(setUserActiveAction, { onSuccess });
  const resendAction = useAction(resendInviteAction, { onSuccess });
  const cancelAction = useAction(cancelInviteAction, { onSuccess });
  const error =
    activeAction.result.serverError ??
    resendAction.result.serverError ??
    cancelAction.result.serverError;
  const busy = activeAction.isExecuting || resendAction.isExecuting || cancelAction.isExecuting;

  return (
    <div className="grid gap-3">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {resendAction.result.data ? <InviteResultCard invited={resendAction.result.data} /> : null}
      <ul aria-label="Daftar karyawan" className="grid gap-3">
        {accounts.map((account) => {
          const name = account.fullName || account.email;
          const locked =
            manageProblem({
              actorId: actor.id,
              actorRoles: actor.roles,
              targetId: account.id,
              targetRoles: account.roles,
            }) !== null;
          const pending = account.status === "menunggu_aktivasi";
          return (
            <li
              key={account.id}
              aria-label={name}
              className="grid gap-3 app-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Avatar src={account.avatarUrl} name={name} className="size-12" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <span className="truncate">{account.fullName || "Tanpa nama"}</span>
                    {account.status === "aktif" ? null : (
                      <Badge variant={pending ? "outline" : "secondary"}>
                        {STATUS_LABEL[account.status]}
                      </Badge>
                    )}
                    {account.id === actor.id ? <Badge variant="outline">Anda</Badge> : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                  <ul aria-label={`Role ${name}`} className="mt-2 flex flex-wrap gap-1.5">
                    {account.roles.map((role, index) => (
                      <li key={role}>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {ROLE_LABELS[role]}
                          {index === 0 && account.roles.length > 1 ? " (utama)" : ""}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pending && account.invitedAt
                      ? `Diundang ${formatDateWIB(account.invitedAt)}`
                      : `Dibuat ${formatDateWIB(account.createdAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={locked || busy}
                  onClick={() => {
                    setEditing(account);
                  }}
                >
                  Ubah role
                </Button>
                {pending ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={locked || busy}
                      onClick={() => {
                        resendAction.execute({ userId: account.id });
                      }}
                    >
                      Kirim ulang undangan
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={locked || busy}
                      onClick={() => {
                        setConfirming({ kind: "batalkan", account });
                      }}
                    >
                      Batalkan undangan
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant={account.isActive ? "outline" : "default"}
                    disabled={locked || busy}
                    onClick={() => {
                      if (account.isActive) setConfirming({ kind: "nonaktifkan", account });
                      else activeAction.execute({ userId: account.id, active: true });
                    }}
                  >
                    {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {confirming ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirming(null);
          }}
          title={
            confirming.kind === "nonaktifkan"
              ? `Nonaktifkan akun ${confirming.account.fullName || confirming.account.email}?`
              : `Batalkan undangan ${confirming.account.fullName || confirming.account.email}?`
          }
          description={
            confirming.kind === "nonaktifkan"
              ? "Akun langsung keluar dari semua perangkat dan tidak bisa masuk sampai diaktifkan lagi."
              : "Tautan aktivasi tidak berlaku lagi dan akun dihapus dari daftar."
          }
          confirmLabel={confirming.kind === "nonaktifkan" ? "Ya, nonaktifkan" : "Ya, batalkan"}
          icon={confirming.kind === "nonaktifkan" ? UserRemove01Icon : MailRemove01Icon}
          busy={busy}
          error={error}
          onConfirm={() => {
            if (confirming.kind === "nonaktifkan") {
              activeAction.execute({ userId: confirming.account.id, active: false });
            } else {
              cancelAction.execute({ userId: confirming.account.id });
            }
          }}
        />
      ) : null}
      {editing ? (
        <EditRolesDialog
          account={editing}
          allowOwner={actor.roles.includes("owner")}
          onClose={() => {
            setEditing(null);
          }}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function EditRolesDialog({
  account,
  allowOwner,
  onClose,
  onSaved,
}: {
  account: PortalAccount;
  allowOwner: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const current = account.roles.filter(isInvitableRole);
  const [value, setValue] = useState<RoleSelection>({
    roles: current,
    primaryRole: current[0] ?? "marketing",
  });
  const action = useAction(setUserRolesAction, { onSuccess: onSaved });
  const name = account.fullName || account.email;

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Ubah role ${name}`}
      description="Hak akses adalah gabungan semua role yang dipilih. Perubahan berlaku saat itu juga."
      busy={action.isExecuting}
      icon={SecurityCheckIcon}
    >
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (value.roles.length > 0) action.execute({ userId: account.id, ...value });
        }}
      >
        <RolePicker
          idPrefix="ubah"
          allowOwner={allowOwner}
          disabled={action.isExecuting}
          value={value}
          onChange={setValue}
          rolesError={value.roles.length === 0 ? "Pilih minimal satu role." : undefined}
        />
        {action.result.serverError ? (
          <p role="alert" className="text-sm text-destructive">
            {action.result.serverError}
          </p>
        ) : null}
        <FormDialogFooter
          busy={action.isExecuting}
          disabled={value.roles.length === 0}
          saveLabel="Simpan role"
          onCancel={onClose}
        />
      </form>
    </FormDialog>
  );
}
