"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { CircleCheck, Phone, Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_CONSENT_TEXT } from "@/config/legal";
import { whatsappLink } from "@/config/site";
import { env } from "@/env";
import { submitLeadAction } from "../actions/submit-lead";
import { leadFormSchema, type LeadFormInput } from "../schemas/lead";
import { readTracking } from "../utils/tracking";
import { TurnstileWidget } from "./turnstile-widget";

type FormKind = LeadFormInput["formKind"];

const COPY: Record<FormKind, { submit: string; success: string; showMessage: boolean }> = {
  minat: {
    submit: "Kirim",
    success: "Terima kasih. Marketing kami menghubungi Anda lewat WhatsApp di jam kerja.",
    showMessage: true,
  },
  kontak: {
    submit: "Kirim pesan",
    success: "Pesan terkirim. Marketing kami membalas lewat WhatsApp di jam kerja.",
    showMessage: true,
  },
  brosur: {
    submit: "Minta brosur",
    success: "Permintaan diterima. Marketing kami mengirim brosur lewat WhatsApp.",
    showMessage: false,
  },
};

/**
 * Form lead publik. Validasi di browser dan server memakai skema yang sama. Tombol nonaktif selama
 * mengirim (cegah kirim dua kali). Honeypot tersembunyi dari manusia dan pembaca layar.
 */
export function LeadForm({
  formKind,
  projectSlug,
  projectName,
  idPrefix,
}: {
  formKind: FormKind;
  projectSlug?: string;
  projectName?: string;
  idPrefix: string;
}) {
  const copy = COPY[formKind];
  const messageId = useId();
  const consentId = useId();
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const onToken = useCallback((token: string | undefined) => {
    setTurnstileToken(token);
  }, []);

  const form = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      message: "",
      consent: false,
      website: "",
      formKind,
      projectSlug,
    },
  });
  const { execute, result, isExecuting, hasSucceeded } = useAction(submitLeadAction);
  const errors = form.formState.errors;

  if (hasSucceeded) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-lg bg-success-50 p-5">
        <CircleCheck aria-hidden="true" className="size-8 text-success-700" />
        <p className="font-semibold">{copy.success}</p>
        <Button asChild variant="outline">
          <a
            href={whatsappLink(
              projectName
                ? `Halo, saya baru mengisi form ${projectName}.`
                : "Halo, saya baru mengisi form di website.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Phone aria-hidden="true" />
            Lanjut chat WhatsApp
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-label={`Form ${formKind}`}
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute({
            ...values,
            pagePath: window.location.pathname,
            turnstileToken,
            tracking: readTracking(),
          });
        })(event);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nama"
          autoComplete="name"
          error={errors.fullName?.message}
          {...form.register("fullName")}
        />
        <TextField
          label="Nomor WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          error={errors.phone?.message}
          {...form.register("phone")}
        />
      </div>
      <TextField
        label="Email (opsional)"
        type="email"
        inputMode="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register("email")}
      />
      {copy.showMessage ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={messageId}>Pesan (opsional)</Label>
          <Textarea
            id={messageId}
            rows={3}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? `${messageId}-error` : undefined}
            {...form.register("message")}
          />
          {errors.message ? (
            <p id={`${messageId}-error`} className="text-sm text-destructive">
              {errors.message.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Honeypot: disembunyikan dari pengunjung dan pembaca layar, hanya diisi bot. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          id={`${idPrefix}-website`}
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
                id={consentId}
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                }}
                onBlur={field.onBlur}
                aria-invalid={fieldState.error ? true : undefined}
                aria-describedby={fieldState.error ? `${consentId}-error` : undefined}
                className="mt-0.5 size-5"
              />
              <Label htmlFor={consentId} className="block text-sm leading-relaxed font-normal">
                {LEAD_CONSENT_TEXT.replace(/kebijakan privasi\.$/, "")}
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
              <p id={`${consentId}-error`} className="text-sm text-destructive">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />

      <TurnstileWidget siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onToken={onToken} />

      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" disabled={isExecuting}>
          <Send aria-hidden="true" />
          {isExecuting ? "Mengirim" : copy.submit}
        </Button>
      </div>
    </form>
  );
}
