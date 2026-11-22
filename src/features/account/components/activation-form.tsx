"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { activateAccountAction } from "../actions/account";
import { activationSchema, type ActivationInput } from "../schemas/account";
import { AvatarUploader } from "./avatar-uploader";
import { PasswordField } from "@/components/shared/password-field";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export function ActivationForm({
  email,
  fullName,
  phone,
  avatarUrl,
  hasAvatar,
  needsPassword,
}: {
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  hasAvatar: boolean;
  needsPassword: boolean;
}) {
  const [avatarReady, setAvatarReady] = useState(hasAvatar);
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const form = useForm<ActivationInput>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      fullName,
      phone: phone?.replace(/^\+62/, "0") ?? "",
      needsPassword,
      password: "",
      confirm: "",
    },
  });
  const { execute, result, isExecuting } = useAction(activateAccountAction);
  const password = useWatch({ control: form.control, name: "password" }) ?? "";
  const watchedName = useWatch({ control: form.control, name: "fullName" });

  return (
    <form
      noValidate
      aria-label="Aktivasi akun"
      className="grid gap-6"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          if (!avatarReady) {
            setAvatarError("Ambil atau pilih foto profil dulu.");
            return;
          }
          execute(values);
        })(event);
      }}
    >
      <AvatarUploader
        name={watchedName}
        initialUrl={avatarUrl}
        error={avatarError}
        onUploaded={() => {
          setAvatarReady(true);
          setAvatarError(undefined);
        }}
      />

      <div className="grid gap-4">
        <TextField
          label="Email"
          value={email}
          readOnly
          disabled
          hint="Email untuk masuk. Tidak bisa diubah."
        />
        <TextField
          label="Nama lengkap"
          autoComplete="name"
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />
        <TextField
          label="Nomor HP (WhatsApp)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          error={form.formState.errors.phone?.message}
          {...form.register("phone")}
        />
      </div>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-semibold">
          {needsPassword ? "Buat password" : "Ganti password (opsional)"}
        </legend>
        <PasswordField
          label="Password baru"
          autoComplete="new-password"
          meter
          currentValue={password}
          hint="Minimal 10 karakter, ada huruf besar, huruf kecil, dan angka."
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <PasswordField
          label="Ulangi password"
          autoComplete="new-password"
          error={form.formState.errors.confirm?.message}
          {...form.register("confirm")}
        />
      </fieldset>

      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={isExecuting} className="w-full">
        <Icon icon={CheckmarkCircle02Icon} aria-hidden="true" />
        {isExecuting ? "Menyimpan" : "Aktifkan akun"}
      </Button>
    </form>
  );
}
