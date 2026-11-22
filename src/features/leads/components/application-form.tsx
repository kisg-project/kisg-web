"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/env";
import { applicationSchema, cvProblem, type ApplicationInput } from "../schemas/application";
import { TurnstileWidget } from "./turnstile-widget";
import { CheckmarkCircle02Icon, SentIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

const GENERIC_ERROR = "Lamaran gagal terkirim. Periksa koneksi, lalu coba lagi.";

export function ApplicationForm({
  careerSlug,
  careerTitle,
}: {
  careerSlug: string;
  careerTitle: string;
}) {
  const ids = { note: useId(), consent: useId(), cv: useId() };
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const onToken = useCallback((token: string | undefined) => {
    setTurnstileToken(token);
  }, []);

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      coverNote: "",
      consent: false,
      website: "",
      careerSlug,
    },
  });
  const errors = form.formState.errors;

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-3xl bg-success-50 p-5">
        <Icon icon={CheckmarkCircle02Icon} aria-hidden="true" className="size-8 text-success-700" />
        <p className="font-semibold">
          Lamaran untuk {careerTitle} terkirim. Kami menghubungi kandidat yang sesuai lewat WhatsApp
          atau email.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-label="Form lamaran"
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit(async (values) => {
          const problem = cvProblem(cv);
          setCvError(problem);
          if (problem || !cv) return;
          setServerError(null);
          setState("sending");
          const body = new FormData();
          body.set("fullName", values.fullName);
          body.set("phone", values.phone);
          body.set("email", values.email);
          body.set("coverNote", values.coverNote ?? "");
          body.set("consent", String(values.consent));
          body.set("website", values.website ?? "");
          body.set("careerSlug", values.careerSlug);
          if (turnstileToken) body.set("turnstileToken", turnstileToken);
          body.set("cv", cv);
          try {
            const response = await fetch("/api/lamaran", { method: "POST", body });
            const data = (await response.json().catch(() => ({}))) as {
              ok?: boolean;
              message?: string;
            };
            if (response.ok && data.ok) {
              setState("sent");
              return;
            }
            setServerError(data.message ?? GENERIC_ERROR);
          } catch {
            setServerError(GENERIC_ERROR);
          }
          setState("idle");
        })(event);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nama lengkap"
          autoComplete="name"
          error={errors.fullName?.message}
          {...form.register("fullName")}
        />
        <TextField
          label="Nomor WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...form.register("phone")}
        />
      </div>
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register("email")}
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={ids.cv}>CV (PDF, maksimal 2 MB)</Label>
        <input
          id={ids.cv}
          type="file"
          accept="application/pdf,.pdf"
          aria-invalid={cvError ? true : undefined}
          aria-describedby={cvError ? `${ids.cv}-error` : undefined}
          className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:font-semibold file:text-primary-800"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setCv(file);
            setCvError(file ? cvProblem(file) : null);
          }}
        />
        {cvError ? (
          <p id={`${ids.cv}-error`} className="text-sm text-destructive">
            {cvError}
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={ids.note}>Catatan (opsional)</Label>
        <Textarea id={ids.note} rows={3} {...form.register("coverNote")} />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="lamaran-website">Website</label>
        <input
          id="lamaran-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>

      <Controller
        control={form.control}
        name="consent"
        render={({ field, fieldState }) => (
          <div className="grid gap-1.5">
            <div className="flex items-start gap-3">
              <Checkbox
                id={ids.consent}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                }}
                aria-invalid={fieldState.error ? true : undefined}
                aria-describedby={fieldState.error ? `${ids.consent}-error` : undefined}
                className="mt-0.5 size-5"
              />
              <Label htmlFor={ids.consent} className="block text-sm leading-relaxed font-normal">
                Saya setuju data dan CV saya dipakai KIS Group untuk proses rekrutmen, sesuai{" "}
                <Link
                  href="/kebijakan-privasi"
                  target="_blank"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  kebijakan privasi
                </Link>
                .
              </Label>
            </div>
            {fieldState.error ? (
              <p id={`${ids.consent}-error`} className="text-sm text-destructive">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <TurnstileWidget siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onToken={onToken} />

      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" disabled={state === "sending"}>
          <Icon icon={SentIcon} aria-hidden="true" />
          {state === "sending" ? "Mengirim" : "Kirim lamaran"}
        </Button>
      </div>
    </form>
  );
}
