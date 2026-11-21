"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden="true" />
        Hapus {kind}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {kind} ini?</DialogTitle>
            <DialogDescription>
              {`"${title}" hilang dari website. Tindakan ini tidak bisa dibatalkan dari panel CMS.`}
            </DialogDescription>
          </DialogHeader>
          {action.result.serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {action.result.serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={action.isExecuting}
              onClick={() => {
                action.execute({ id });
              }}
            >
              {action.isExecuting ? "Menghapus" : "Ya, hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
