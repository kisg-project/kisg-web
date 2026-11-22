"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "@/components/shared/toast";
import type { ApprovalDecision } from "@/config/approvals";
import { ApprovalDialog } from "@/features/approvals";
import { decideExceptionAction } from "../actions/attendance";

export function ExceptionDecision({
  id,
  summary,
  fingerprint,
}: {
  id: string;
  summary: ReactNode;
  fingerprint: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<ApprovalDecision | null>(null);
  const { execute, result, isPending, reset } = useAction(decideExceptionAction, {
    onSuccess: ({ input }) => {
      setOpen(null);
      toast.success(input.decision === "disetujui" ? "Pengajuan disetujui." : "Pengajuan ditolak.");
      router.refresh();
    },
  });
  const fieldErrors = {
    password: result.validationErrors?.password?._errors?.[0],
    note: result.validationErrors?.note?._errors?.[0],
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(["disetujui", "ditolak"] as const).map((decision) => (
        <ApprovalDialog
          key={decision}
          decision={decision}
          docType="absen_luar_lokasi"
          docId={id}
          fingerprint={fingerprint}
          summary={summary}
          pending={isPending}
          open={open === decision}
          onOpenChange={(next) => {
            reset();
            setOpen(next ? decision : null);
          }}
          serverError={open === decision ? result.serverError : undefined}
          fieldErrors={open === decision ? fieldErrors : undefined}
          onSign={(signed) => {
            execute({ id, decision, ...signed });
          }}
        />
      ))}
    </div>
  );
}
