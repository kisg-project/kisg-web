"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { PasswordField } from "@/components/shared/password-field";
import { Button } from "@/components/ui/button";
import { updatePasswordAction } from "../actions/auth";
import { newPasswordSchema, type NewPasswordInput } from "../schemas/auth";

/** Dipakai untuk atur ulang password dan untuk menerima undangan. */
export function NewPasswordForm() {
  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const password = useWatch({ control: form.control, name: "password" });
  const { execute, result, isExecuting } = useAction(updatePasswordAction);

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
      <PasswordField
        label="Password baru"
        autoComplete="new-password"
        meter
        currentValue={password}
        hint="Minimal 10 karakter, memuat huruf besar, huruf kecil, dan angka."
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
      <Button type="submit" size="lg" disabled={isExecuting}>
        {isExecuting ? "Menyimpan" : "Simpan password"}
      </Button>
    </form>
  );
}
