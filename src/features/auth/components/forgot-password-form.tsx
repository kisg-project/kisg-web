"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "../actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas/auth";

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { execute, result, isExecuting, hasSucceeded } = useAction(forgotPasswordAction);

  if (hasSucceeded) {
    return (
      <div role="status" className="grid gap-4">
        <p className="text-sm">
          Kalau email itu terdaftar, tautan atur ulang password sudah dikirim. Periksa kotak masuk
          dan folder spam. Tautan berlaku 1 jam.
        </p>
        <Link
          href="/portal/login"
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
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
        label="Email akun portal"
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
        {isExecuting ? "Mengirim" : "Kirim tautan"}
      </Button>
      <Link
        href="/portal/login"
        className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
