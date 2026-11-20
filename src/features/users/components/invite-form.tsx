"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { Copy, MessageCircle, UserPlus } from "lucide-react";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_ROLES, ROLE_LABELS } from "@/config/roles";
import { inviteUserAction } from "../actions/users";
import { inviteUserSchema, type InviteUserInput } from "../schemas/users";

/** Undang karyawan. Tautan undangan ditampilkan untuk dikirim lewat WhatsApp (berlaku 24 jam). */
export function InviteForm() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { fullName: "", email: "", role: "marketing" },
  });
  const { execute, result, isExecuting, reset } = useAction(inviteUserAction, {
    onSuccess() {
      router.refresh();
    },
  });
  const invited = result.data;

  if (invited) {
    const message = `Halo, ini undangan akun Portal KIS Group. Buka tautan ini untuk membuat password: ${invited.link}`;
    return (
      <div role="status" className="grid gap-4 rounded-lg bg-success-50 p-5">
        <p className="font-semibold">Undangan untuk {invited.email} sudah dibuat.</p>
        <p className="text-sm text-subtle-foreground">
          Kirim tautan ini ke karyawan. Tautan hanya bisa dipakai sekali dan berlaku 24 jam.
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
          <Button
            type="button"
            onClick={() => {
              reset();
              setCopied(false);
              form.reset();
            }}
          >
            Undang lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-label="Undang pengguna"
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
        name="role"
        render={({ field, fieldState }) => (
          <div className="flex min-w-0 flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="undang-role">Role</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="undang-role"
                className="h-11 w-full rounded-md px-3"
                aria-invalid={fieldState.error ? true : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {APP_ROLES.map((role) => (
                  <SelectItem key={role} value={role} className="min-h-10">
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error ? (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            ) : null}
          </div>
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
          {isExecuting ? "Membuat undangan" : "Buat undangan"}
        </Button>
      </div>
    </form>
  );
}
