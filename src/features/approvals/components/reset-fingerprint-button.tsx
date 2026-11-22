"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { ConfirmDialog } from "@/components/shared/form-dialog";
import { toast } from "@/components/shared/toast";
import { resetFingerprintAction } from "../actions/signature";
import { FingerPrintIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export function ResetFingerprintButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { execute, isExecuting, result, reset } = useAction(resetFingerprintAction, {
    onSuccess() {
      setOpen(false);
      toast.success("Sidik jari direset.");
      router.refresh();
    },
  });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        reset();
        setOpen(next);
      }}
      title={`Reset sidik jari ${name}?`}
      description="Tanda tangan berikutnya perlu daftar ulang."
      confirmLabel="Ya, reset"
      busyLabel="Mereset"
      icon={FingerPrintIcon}
      busy={isExecuting}
      error={result.serverError}
      onConfirm={() => {
        execute({ userId });
      }}
      trigger={
        <button
          type="button"
          aria-label={`Reset sidik jari ${name}`}
          title="Reset sidik jari"
          className="hit-44 flex size-9 items-center justify-center rounded-lg border border-(--line-strong) bg-card text-violet-700 transition-colors hover:bg-violet-50 dark:hover:bg-neutral-800"
        >
          <Icon icon={FingerPrintIcon} className="size-4" />
        </button>
      }
    />
  );
}
