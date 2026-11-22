"use client";

import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { passwordStrength, type PasswordStrength } from "@/lib/auth/password-strength";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

const STRENGTH: Record<
  Exclude<PasswordStrength, "kosong">,
  { label: string; bars: number; tone: string }
> = {
  lemah: { label: "Lemah", bars: 1, tone: "bg-destructive" },
  sedang: { label: "Cukup", bars: 2, tone: "bg-warning-500" },
  kuat: { label: "Kuat", bars: 3, tone: "bg-success-600" },
};

interface PasswordFieldProps extends Omit<ComponentProps<"input">, "id" | "type"> {
  label: string;
  error?: string;
  hint?: string;
  meter?: boolean;
  currentValue?: string;
}

export function PasswordField({
  label,
  error,
  hint,
  meter,
  currentValue = "",
  ...props
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(currentValue);
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
    meter ? `${id}-meter` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="h-11 pr-12"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        <button
          type="button"
          aria-label={
            visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`
          }
          aria-pressed={visible}
          onClick={() => {
            setVisible((value) => !value);
          }}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground"
        >
          {visible ? (
            <Icon icon={ViewOffSlashIcon} aria-hidden="true" className="size-4" />
          ) : (
            <Icon icon={ViewIcon} aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {meter ? (
        <div id={`${id}-meter`} className="flex items-center gap-2" aria-live="polite">
          <div aria-hidden="true" className="grid flex-1 grid-cols-3 gap-1">
            {[1, 2, 3].map((bar) => (
              <span
                key={bar}
                className={cn(
                  "h-1.5 rounded-full bg-muted transition-colors",
                  strength !== "kosong" &&
                    bar <= STRENGTH[strength].bars &&
                    STRENGTH[strength].tone,
                )}
              />
            ))}
          </div>
          <span className="w-24 text-right text-xs text-muted-foreground">
            {strength === "kosong" ? "" : `Kekuatan: ${STRENGTH[strength].label}`}
          </span>
        </div>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
