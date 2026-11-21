"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { PasswordField } from "@/components/shared/password-field";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { loginAction } from "../actions/auth";
import { loginSchema, type AuthApp, type LoginInput } from "../schemas/auth";

const PAGE_MESSAGES: Record<string, string> = {
  tautan: "Tautan sudah tidak berlaku. Minta tautan baru lewat lupa password.",
  nonaktif: "Akun Anda sudah tidak aktif. Hubungi owner.",
};

export function LoginForm({
  next,
  message,
  app = "portal",
}: {
  next?: string;
  message?: string;
  /** Portal karyawan atau panel CMS (akun terpisah). */
  app?: AuthApp;
}) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { app, email: "", password: "", next },
  });
  const { execute, result, isPending, hasNavigated } = useAction(loginAction);
  // Setelah password benar, server mengalihkan ke beranda. Tombol tetap menampilkan proses sampai
  // halaman tujuan tampil, supaya tidak terasa diam.
  const busy = isPending || hasNavigated;
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
      <PasswordField
        label="Password"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={busy}
        aria-busy={busy}
        // Saat memproses tombol tetap berwarna penuh, bukan pudar seperti tombol nonaktif.
        className="aria-busy:opacity-100"
      >
        {busy ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : null}
        {hasNavigated ? "Membuka beranda" : isPending ? "Sedang masuk" : "Masuk"}
      </Button>
      <Link
        href={app === "cms" ? "/cms/lupa-password" : "/portal/lupa-password"}
        className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Lupa password
      </Link>
    </form>
  );
}
