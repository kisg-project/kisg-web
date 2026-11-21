"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { changePasswordAction, updateProfileAction } from "../actions/account";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "../schemas/account";
import { AvatarUploader } from "./avatar-uploader";
import { PasswordField } from "@/components/shared/password-field";

/** Foto profil di halaman Akun saya. Tersimpan langsung setelah diunggah. */
export function ProfilePhotoForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const router = useRouter();
  return (
    <AvatarUploader
      name={name}
      initialUrl={avatarUrl}
      onUploaded={() => {
        toast.success("Foto profil diperbarui.");
        router.refresh();
      }}
    />
  );
}

/** Nama dan nomor HP. */
export function ProfileForm({ fullName, phone }: { fullName: string; phone: string | null }) {
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName, phone: phone?.replace(/^\+62/, "0") ?? "" },
  });
  const { execute, result, isExecuting } = useAction(updateProfileAction, {
    onSuccess() {
      toast.success("Data diri tersimpan.");
      router.refresh();
    },
  });
  return (
    <form
      noValidate
      aria-label="Data diri"
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
          error={form.formState.errors.phone?.message}
          {...form.register("phone")}
        />
      </div>
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={isExecuting}>
          {isExecuting ? "Menyimpan" : "Simpan data diri"}
        </Button>
      </div>
    </form>
  );
}

/** Ganti password dengan memasukkan password saat ini. */
export function ChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", password: "", confirm: "" },
  });
  const newPassword = useWatch({ control: form.control, name: "password" });
  const { execute, result, isExecuting } = useAction(changePasswordAction, {
    onSuccess() {
      toast.success("Password diganti. Pakai password baru saat masuk berikutnya.");
      form.reset();
    },
  });
  return (
    <form
      noValidate
      aria-label="Ganti password"
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      <PasswordField
        label="Password saat ini"
        autoComplete="current-password"
        error={form.formState.errors.current?.message}
        {...form.register("current")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          label="Password baru"
          autoComplete="new-password"
          meter
          currentValue={newPassword}
          hint="Minimal 10 karakter, ada huruf besar, huruf kecil, dan angka."
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <PasswordField
          label="Ulangi password baru"
          autoComplete="new-password"
          error={form.formState.errors.confirm?.message}
          {...form.register("confirm")}
        />
      </div>
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={isExecuting}>
          {isExecuting ? "Menyimpan" : "Ganti password"}
        </Button>
      </div>
    </form>
  );
}
