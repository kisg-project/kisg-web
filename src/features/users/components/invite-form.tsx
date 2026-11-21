"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { Copy, MailCheck, MessageCircle, UserPlus } from "lucide-react";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { inviteUserAction } from "../actions/users";
import { inviteUserSchema, type InviteUserInput } from "../schemas/users";
import { RolePicker } from "./role-picker";

export interface InviteResult {
  email: string;
  link: string;
  emailed: boolean;
}

/**
 * Hasil undangan. Email terkirim: cukup konfirmasi. Email belum aktif atau gagal: tautan
 * ditampilkan untuk disalin atau dikirim lewat WhatsApp.
 */
export function InviteResultCard({
  invited,
  onDone,
}: {
  invited: InviteResult;
  onDone?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = `Halo, ini undangan akun KIS Operasional. Buka tautan ini untuk mengaktifkan akun: ${invited.link}`;
  return (
    <div role="status" className="grid gap-4 rounded-lg bg-success-50 p-5">
      {invited.emailed ? (
        <p className="flex items-start gap-2 font-semibold">
          <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-700" />
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
          <Copy aria-hidden="true" />
          {copied ? "Tautan tersalin" : "Salin tautan"}
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" />
            Kirim lewat WhatsApp
          </a>
        </Button>
        {onDone ? (
          <Button type="button" onClick={onDone}>
            Undang lagi
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Undang karyawan: nama, email, satu atau beberapa role, dan role utama. */
export function InviteForm({ allowOwner }: { allowOwner: boolean }) {
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
      <div>
        <Button type="submit" size="lg" disabled={isExecuting}>
          <UserPlus aria-hidden="true" />
          {isExecuting ? "Mengirim undangan" : "Kirim undangan"}
        </Button>
      </div>
    </form>
  );
}
