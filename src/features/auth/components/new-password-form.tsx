"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { updatePasswordAction } from "../actions/auth";
import { newPasswordSchema, type NewPasswordInput } from "../schemas/auth";

/** Dipakai untuk atur ulang password dan untuk menerima undangan. */
export function NewPasswordForm() {
  const router = useRouter();
  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { execute, result, isExecuting } = useAction(updatePasswordAction, {
    onSuccess({ data }) {
      router.replace(data.redirectTo);
    },
  });

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
        label="Password baru"
        type="password"
        autoComplete="new-password"
        hint="Minimal 10 karakter, memuat huruf besar, huruf kecil, dan angka."
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <TextField
        label="Ulangi password baru"
        type="password"
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
