"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { PasswordField } from "@/components/shared/password-field";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, resetPasswordWithCodeAction } from "../actions/auth";
import {
  forgotPasswordSchema,
  resetWithCodeSchema,
  type AuthApp,
  type ForgotPasswordInput,
  type ResetWithCodeInput,
} from "../schemas/auth";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

function BackToLogin({ app }: { app: AuthApp }) {
  return (
    <Link
      href={app === "cms" ? "/cms/login" : "/portal/login"}
      className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
    >
      Kembali ke halaman masuk
    </Link>
  );
}

function CodeStep({
  app,
  email,
  onResend,
  resending,
}: {
  app: AuthApp;
  email: string;
  onResend: () => void;
  resending: boolean;
}) {
  const form = useForm<ResetWithCodeInput>({
    resolver: zodResolver(resetWithCodeSchema),
    defaultValues: { app, email, code: "", password: "", confirm: "" },
  });
  const newPassword = useWatch({ control: form.control, name: "password" });
  const { execute, result, isPending, hasNavigated } = useAction(resetPasswordWithCodeAction);
  const busy = isPending || hasNavigated;
  return (
    <form
      noValidate
      aria-label="Atur password baru"
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      <p role="status" className="text-sm">
        Kalau email itu terdaftar, kode 6 digit sudah dikirim ke <strong>{email}</strong>. Periksa
        kotak masuk dan folder spam.
      </p>
      <TextField
        label="Kode dari email"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="tracking-[0.4em] tabular"
        error={form.formState.errors.code?.message}
        {...form.register("code")}
      />
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
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={busy}
        aria-busy={busy}
        className="aria-busy:opacity-100"
      >
        {busy ? (
          <Icon icon={Loading03Icon} aria-hidden="true" className="size-5 animate-spin" />
        ) : null}
        {hasNavigated ? "Membuka beranda" : isPending ? "Menyimpan" : "Simpan password baru"}
      </Button>
      <Button type="button" variant="ghost" disabled={resending} onClick={onResend}>
        {resending ? "Mengirim ulang" : "Kirim ulang kode"}
      </Button>
      <BackToLogin app={app} />
    </form>
  );
}

export function ForgotPasswordForm({ app = "portal" }: { app?: AuthApp }) {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { app, email: "" },
  });
  const { execute, result, isExecuting, hasSucceeded, input } = useAction(forgotPasswordAction);

  if (hasSucceeded) {
    return (
      <CodeStep
        app={app}
        email={input.email}
        resending={isExecuting}
        onResend={() => {
          execute(input);
        }}
      />
    );
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      <TextField
        label={app === "cms" ? "Email akun CMS" : "Email akun portal"}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={isExecuting}>
        {isExecuting ? "Mengirim" : "Kirim kode"}
      </Button>
      <BackToLogin app={app} />
    </form>
  );
}
