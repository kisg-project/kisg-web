"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { inviteUserAction } from "../actions/users";
import { inviteUserSchema, type InviteUserInput } from "../schemas/users";
import { RolePicker } from "./role-picker";
import {
  Copy01Icon,
  MailValidation01Icon,
  UserAdd01Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export interface InviteResult {
  email: string;
  link: string;
  emailed: boolean;
}

export function InviteResultCard({
  invited,
  onDone,
  onClose,
}: {
  invited: InviteResult;
  onDone?: () => void;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = `Halo, ini undangan akun KIS Operasional. Buka tautan ini untuk mengaktifkan akun: ${invited.link}`;
  return (
    <div role="status" className="grid gap-4 rounded-lg bg-success-50 p-5">
      {invited.emailed ? (
        <p className="flex items-start gap-2 font-semibold">
          <Icon
            icon={MailValidation01Icon}
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-success-700"
          />
          Undangan terkirim ke {invited.email}.
        </p>
      ) : (
        <p className="font-semibold">Undangan untuk {invited.email} sudah dibuat.</p>
      )}
      <p className="text-sm text-subtle-foreground">
        {invited.emailed
          ? "Kalau email tidak masuk dalam beberapa menit, salin tautan di bawah dan kirim lewat WhatsApp."
          : "Email sistem belum aktif. Kirim tautan ini ke karyawan."}{" "}
        Tautan berlaku 24 jam dan hanya bisa dipakai sekali.
      </p>
      <code className="rounded-md bg-background px-3 py-2 text-xs break-all">{invited.link}</code>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(invited.link).then(() => {
              setCopied(true);
            });
          }}
        >
          <Icon icon={Copy01Icon} aria-hidden="true" />
          {copied ? "Tautan tersalin" : "Salin tautan"}
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon={WhatsappIcon} aria-hidden="true" />
            Kirim lewat WhatsApp
          </a>
        </Button>
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Undang lagi
          </Button>
        ) : null}
        {onClose ? (
          <Button type="button" variant="save" onClick={onClose}>
            Selesai
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function InviteForm({
  allowOwner,
  onCancel,
}: {
  allowOwner: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { fullName: "", email: "", roles: ["marketing"], primaryRole: "marketing" },
  });
  const primaryRole = useWatch({ control: form.control, name: "primaryRole" });
  const { execute, result, isExecuting, reset } = useAction(inviteUserAction, {
    onSuccess() {
      router.refresh();
    },
  });

  if (result.data) {
    return (
      <InviteResultCard
        invited={result.data}
        onDone={() => {
          reset();
          form.reset();
        }}
        onClose={onCancel}
      />
    );
  }

  return (
    <form
      noValidate
      aria-label="Undang karyawan"
      className="grid gap-5"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nama lengkap"
          autoComplete="off"
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="off"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
      </div>
      <Controller
        control={form.control}
        name="roles"
        render={({ field }) => (
          <RolePicker
            idPrefix="undang"
            allowOwner={allowOwner}
            disabled={isExecuting}
            value={{ roles: field.value, primaryRole }}
            onChange={(next) => {
              field.onChange(next.roles);
              form.setValue("primaryRole", next.primaryRole, {
                shouldValidate: form.formState.isSubmitted,
              });
            }}
            rolesError={form.formState.errors.roles?.message}
            primaryError={form.formState.errors.primaryRole?.message}
          />
        )}
      />
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      {onCancel ? (
        <FormDialogFooter
          busy={isExecuting}
          onCancel={onCancel}
          saveLabel="Kirim undangan"
          busyLabel="Mengirim"
        />
      ) : (
        <div>
          <Button type="submit" size="lg" disabled={isExecuting}>
            <Icon icon={UserAdd01Icon} aria-hidden="true" />
            {isExecuting ? "Mengirim undangan" : "Kirim undangan"}
          </Button>
        </div>
      )}
    </form>
  );
}

export function InviteDialog({ allowOwner }: { allowOwner: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Undang karyawan"
      description="Karyawan menerima email berisi tautan aktivasi akun."
      icon={UserAdd01Icon}
      trigger={
        <Button type="button">
          <Icon icon={UserAdd01Icon} aria-hidden="true" />
          Undang karyawan
        </Button>
      }
    >
      <InviteForm
        allowOwner={allowOwner}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </FormDialog>
  );
}
