"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Avatar } from "@/components/shared/avatar";
import { ConfirmDialog, FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
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
import {
  MailRemove01Icon,
  MailSend01Icon,
  PencilEdit01Icon,
  SecurityCheckIcon,
  UserCheck01Icon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";

const STATUS: Record<AccountStatus, { label: string; tone: string; dot: string }> = {
  aktif: {
    label: "Aktif",
    tone: "bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-200",
    dot: "bg-success-600",
  },
  menunggu_aktivasi: {
    label: "Menunggu aktivasi",
    tone: "bg-warning-50 text-warning-800 dark:bg-warning-950 dark:text-warning-200",
    dot: "bg-warning-500",
  },
  nonaktif: {
    label: "Nonaktif",
    tone: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    dot: "bg-neutral-500",
  },
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

  const iconButton =
    "hit-44 flex size-9 items-center justify-center rounded-lg border border-(--line-strong) bg-card transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-neutral-800";

  return (
    <div className="grid gap-3">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {resendAction.result.data ? <InviteResultCard invited={resendAction.result.data} /> : null}
      <div className="overflow-hidden rounded-xl border border-(--line-strong) bg-card">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_8.5rem_8rem_8.5rem] items-center gap-4 border-b border-(--line-strong) bg-(--band-soft,var(--color-neutral-100)) px-4 py-2.5 text-xs font-medium text-neutral-700 lg:grid dark:text-neutral-300"
        >
          <span>Nama karyawan</span>
          <span>Role</span>
          <span className="text-center">Status</span>
          <span className="text-center">Bergabung</span>
          <span className="text-right">Aksi</span>
        </div>
        <ul aria-label="Daftar karyawan" className="divide-y divide-(--line-soft)">
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
            const status = STATUS[account.status];
            return (
              <li
                key={account.id}
                aria-label={name}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_8.5rem_8rem_8.5rem] lg:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={account.avatarUrl} name={name} className="size-9" />
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] font-semibold">
                      <span className="truncate">{account.fullName || "Tanpa nama"}</span>
                      {account.id === actor.id ? (
                        <span className="shrink-0 rounded-full border border-(--line-strong) px-1.5 text-[0.625rem] font-medium">
                          Anda
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                  </div>
                </div>
                <ul
                  aria-label={`Role ${name}`}
                  className="col-span-2 row-start-2 flex flex-wrap gap-1 lg:col-span-1 lg:row-start-auto"
                >
                  {account.roles.map((role, index) => (
                    <li
                      key={role}
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium",
                        index === 0
                          ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100"
                          : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                      )}
                    >
                      {ROLE_LABELS[role]}
                      {index === 0 && account.roles.length > 1 ? " (utama)" : ""}
                    </li>
                  ))}
                </ul>
                <span
                  className={cn(
                    "col-start-2 row-start-1 inline-flex w-fit items-center gap-1.5 justify-self-end rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold lg:col-start-auto lg:row-start-auto lg:justify-self-center",
                    status.tone,
                  )}
                >
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", status.dot)} />
                  {status.label}
                </span>
                <span className="hidden text-center text-xs text-muted-foreground tabular-nums lg:block">
                  {formatDateWIB(
                    pending && account.invitedAt ? account.invitedAt : account.createdAt,
                  )}
                </span>
                <div className="col-span-2 flex items-center justify-end gap-1.5 lg:col-span-1">
                  <button
                    type="button"
                    aria-label="Ubah role"
                    title="Ubah role"
                    className={iconButton}
                    disabled={locked || busy}
                    onClick={() => {
                      setEditing(account);
                    }}
                  >
                    <Icon icon={PencilEdit01Icon} className="size-4" />
                  </button>
                  {pending ? (
                    <>
                      <button
                        type="button"
                        aria-label="Kirim ulang undangan"
                        title="Kirim ulang undangan"
                        className={iconButton}
                        disabled={locked || busy}
                        onClick={() => {
                          resendAction.execute({ userId: account.id });
                        }}
                      >
                        <Icon icon={MailSend01Icon} className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Batalkan undangan"
                        title="Batalkan undangan"
                        className={cn(iconButton, "text-danger-700 hover:bg-danger-50")}
                        disabled={locked || busy}
                        onClick={() => {
                          setConfirming({ kind: "batalkan", account });
                        }}
                      >
                        <Icon icon={MailRemove01Icon} className="size-4" />
                      </button>
                    </>
                  ) : account.isActive ? (
                    <button
                      type="button"
                      aria-label="Nonaktifkan"
                      title="Nonaktifkan"
                      className={cn(iconButton, "text-danger-700 hover:bg-danger-50")}
                      disabled={locked || busy}
                      onClick={() => {
                        setConfirming({ kind: "nonaktifkan", account });
                      }}
                    >
                      <Icon icon={UserRemove01Icon} className="size-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label="Aktifkan"
                      title="Aktifkan"
                      className={cn(iconButton, "text-success-700 hover:bg-success-50")}
                      disabled={locked || busy}
                      onClick={() => {
                        activeAction.execute({ userId: account.id, active: true });
                      }}
                    >
                      <Icon icon={UserCheck01Icon} className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
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
