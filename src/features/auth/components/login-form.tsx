"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { loginAction } from "../actions/auth";
import { loginSchema, type LoginInput } from "../schemas/auth";

const PAGE_MESSAGES: Record<string, string> = {
  tautan: "Tautan sudah tidak berlaku. Minta tautan baru lewat lupa password.",
  nonaktif: "Akun Anda sudah tidak aktif. Hubungi admin.",
};

export function LoginForm({ next, message }: { next?: string; message?: string }) {
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });
  const { execute, result, isExecuting } = useAction(loginAction, {
    onSuccess({ data }) {
      router.replace(data.redirectTo);
    },
  });
  const serverError = result.serverError;
  const pageMessage = message ? PAGE_MESSAGES[message] : undefined;

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
      {pageMessage ? (
        <p role="alert" className="rounded-md bg-warning-100 px-3 py-2 text-sm text-warning-800">
          {pageMessage}
        </p>
      ) : null}
      <TextField
        label="Email"
        type="email"
        autoComplete="username"
        inputMode="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={isExecuting}>
        {isExecuting ? "Memeriksa" : "Masuk"}
      </Button>
      <Link
        href="/portal/lupa-password"
        className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Lupa password
      </Link>
    </form>
  );
}
