"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  DashboardSquareEditIcon,
} from "@hugeicons/core-free-icons";
import { FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { Icon, type AppIcon } from "@/components/shared/icon";
import { toast } from "@/components/shared/toast";
import { cn } from "@/lib/utils";
import { saveShortcutsAction } from "../actions";

export interface EditableShortcut {
  href: string;
  label: string;
  icon: AppIcon;
  visible: boolean;
}

const square =
  "hit-44 flex size-8 items-center justify-center rounded-lg border border-(--line-strong) bg-card disabled:pointer-events-none disabled:opacity-30";

export function ShortcutEditor({ initial }: { initial: EditableShortcut[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const { execute, isExecuting } = useAction(saveShortcutsAction, {
    onSuccess() {
      toast.success("Shortcut tersimpan.");
      setOpen(false);
      router.refresh();
    },
    onError() {
      toast.error("Shortcut gagal disimpan. Coba lagi sebentar lagi.");
    },
  });
  const move = (index: number, step: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + step;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return current;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };
  const visibleCount = items.filter((item) => item.visible).length;

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (next) setItems(initial);
        setOpen(next);
      }}
      title="Atur shortcut"
      description="Pilih fitur yang tampil di beranda dan urutannya."
      busy={isExecuting}
      icon={DashboardSquareEditIcon}
      trigger={
        <button
          type="button"
          className="hit-44 inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--line-strong) bg-card px-2.5 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <Icon icon={DashboardSquareEditIcon} className="size-3.5" />
          Atur
        </button>
      }
    >
      <form
        aria-label="Atur shortcut"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isExecuting) return;
          execute({
            order: items.map((item) => item.href),
            hidden: items.filter((item) => !item.visible).map((item) => item.href),
          });
        }}
      >
        <ul aria-label="Daftar shortcut" className="grid gap-2 pt-1">
          {items.map((item, index) => (
            <li
              key={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border border-(--line-strong) px-2.5 py-2",
                !item.visible && "bg-neutral-50 dark:bg-neutral-900",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 ring-1 ring-primary-200 dark:bg-primary-950",
                  !item.visible && "opacity-40",
                )}
              >
                <Icon icon={item.icon} className="size-4 text-primary-800 dark:text-primary-100" />
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[0.8125rem] font-medium",
                  !item.visible && "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={item.visible}
                aria-label={`Tampilkan ${item.label}`}
                disabled={item.visible && visibleCount === 1}
                onClick={() => {
                  setItems((current) =>
                    current.map((entry) =>
                      entry.href === item.href ? { ...entry, visible: !entry.visible } : entry,
                    ),
                  );
                }}
                className={cn(
                  "hit-44 relative flex h-6 w-10 shrink-0 items-center rounded-full border border-(--line-strong) px-0.5 transition-colors disabled:opacity-40",
                  item.visible ? "bg-success-200" : "bg-neutral-100 dark:bg-neutral-800",
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-full border border-(--line-strong) bg-card transition-transform duration-200",
                    item.visible && "translate-x-4",
                  )}
                />
              </button>
              <button
                type="button"
                aria-label={`Naikkan ${item.label}`}
                disabled={index === 0}
                onClick={() => {
                  move(index, -1);
                }}
                className={square}
              >
                <Icon icon={ArrowUp01Icon} className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Turunkan ${item.label}`}
                disabled={index === items.length - 1}
                onClick={() => {
                  move(index, 1);
                }}
                className={square}
              >
                <Icon icon={ArrowDown01Icon} className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <FormDialogFooter
          busy={isExecuting}
          saveLabel="Simpan"
          onCancel={() => {
            setOpen(false);
          }}
        />
      </form>
    </FormDialog>
  );
}
