"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/shared/toast";
import { ConfirmDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { deleteCareerAction, deletePostAction } from "../actions/content";

/** Hapus konten dengan konfirmasi. Konten hilang dari website, data tetap tersimpan untuk audit. */
export function DeleteContentButton({
  kind,
  id,
  title,
}: {
  kind: "berita" | "lowongan";
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const onSuccess = () => {
    toast.success(kind === "berita" ? "Berita dihapus." : "Lowongan dihapus.");
    setOpen(false);
    router.replace(`/cms/${kind}`);
    router.refresh();
  };
  const post = useAction(deletePostAction, { onSuccess });
  const career = useAction(deleteCareerAction, { onSuccess });
  const action = kind === "berita" ? post : career;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={`Hapus ${kind} ini?`}
      description={`"${title}" hilang dari website. Tindakan ini tidak bisa dibatalkan dari panel CMS.`}
      confirmLabel="Ya, hapus"
      icon={Trash2}
      busyLabel="Menghapus"
      busy={action.isExecuting}
      error={action.result.serverError}
      onConfirm={() => {
        action.execute({ id });
      }}
      trigger={
        <Button type="button" variant="outline">
          <Trash2 aria-hidden="true" />
          Hapus {kind}
        </Button>
      }
    />
  );
}
