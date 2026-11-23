"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import {
  Cancel01Icon,
  Exchange01Icon,
  UserAdd01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { ConfirmDialog, FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { assignHolderAction, endHolderAction, setDelegateAction } from "../actions";
import {
  assignHolderSchema,
  delegateSchema,
  type AssignHolderInput,
  type DelegateInput,
} from "../schemas";
import type { OrgChart as OrgChartData, OrgHolder, OrgPerson, OrgPosition } from "../types";
import { coverageFor, delegateOptions, LEVEL_LABEL } from "../utils";

function AssignDialog({
  position,
  employees,
}: {
  position: OrgPosition;
  employees: readonly OrgPerson[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<AssignHolderInput>({
    resolver: zodResolver(assignHolderSchema),
    defaultValues: { positionId: position.id },
  });
  const { execute, isExecuting, result, reset } = useAction(assignHolderAction, {
    onSuccess() {
      toast.success("Pemegang jabatan tersimpan.");
      setOpen(false);
      form.reset({ positionId: position.id });
      router.refresh();
    },
  });
  const choices = employees.filter(
    (person) => !position.holders.some((holder) => holder.person.id === person.id),
  );
  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title={`Pasang ${position.title}`}
      icon={UserAdd01Icon}
      busy={isExecuting}
      trigger={
        <Button type="button" size="sm" variant="outline" aria-label={`Pasang ${position.title}`}>
          <Icon icon={UserAdd01Icon} size={16} />
          Pasang
        </Button>
      }
    >
      <form
        noValidate
        aria-label={`Pemegang ${position.title}`}
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <Controller
          control={form.control}
          name="userId"
          render={({ field, fieldState }) => (
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`pemegang-${position.code}`}>Karyawan</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`pemegang-${position.code}`}
                  className="h-11 w-full rounded-md px-3"
                  aria-invalid={fieldState.error ? true : undefined}
                >
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {choices.map((person) => (
                    <SelectItem key={person.id} value={person.id} className="min-h-10">
                      {person.name}
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
        <FormDialogFooter
          busy={isExecuting}
          onCancel={() => {
            setOpen(false);
          }}
          saveLabel="Pasang"
        />
      </form>
    </FormDialog>
  );
}

function EndHolderButton({ holder, position }: { holder: OrgHolder; position: OrgPosition }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { execute, isExecuting, result } = useAction(endHolderAction, {
    onSuccess() {
      toast.success("Pemegang jabatan dilepas.");
      setOpen(false);
      router.refresh();
    },
  });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={`Lepas ${holder.person.name} dari ${position.title}?`}
      description="Tugas jabatan ini pindah ke atasan terdekat sampai ada pemegang baru."
      confirmLabel="Ya, lepas"
      busy={isExecuting}
      error={result.serverError}
      onConfirm={() => {
        execute({ holderId: holder.id });
      }}
      trigger={
        <button
          type="button"
          aria-label={`Lepas ${holder.person.name} dari ${position.title}`}
          className="hit-44 grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-danger-100 hover:text-danger-700"
        >
          <Icon icon={Cancel01Icon} size={14} />
        </button>
      }
    />
  );
}

function DelegateDialog({
  position,
  positions,
}: {
  position: OrgPosition;
  positions: readonly OrgPosition[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<DelegateInput>({
    resolver: zodResolver(delegateSchema),
    defaultValues: { positionId: position.id, delegateToId: position.delegateToId ?? "atasan" },
  });
  const { execute, isExecuting, result, reset } = useAction(setDelegateAction, {
    onSuccess() {
      toast.success("Pelimpahan tersimpan.");
      setOpen(false);
      router.refresh();
    },
  });
  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title={`Pelimpahan ${position.title}`}
      description="Saat jabatan ini kosong, tugasnya dipegang jabatan yang dipilih."
      icon={Exchange01Icon}
      busy={isExecuting}
      trigger={
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Pelimpahan ${position.title}`}
        >
          <Icon icon={Exchange01Icon} size={16} />
          Pelimpahan
        </Button>
      }
    >
      <form
        noValidate
        aria-label={`Pelimpahan tugas ${position.title}`}
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <Controller
          control={form.control}
          name="delegateToId"
          render={({ field }) => (
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`limpah-${position.code}`}>Dipegang oleh</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`limpah-${position.code}`}
                  className="h-11 w-full rounded-md px-3"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="atasan" className="min-h-10">
                    Atasan langsung
                  </SelectItem>
                  {delegateOptions(position, positions).map((item) => (
                    <SelectItem key={item.id} value={item.id} className="min-h-10">
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        {result.serverError ? (
          <p role="alert" className="text-sm text-destructive">
            {result.serverError}
          </p>
        ) : null}
        <FormDialogFooter
          busy={isExecuting}
          onCancel={() => {
            setOpen(false);
          }}
        />
      </form>
    </FormDialog>
  );
}

function PositionRow({ position, chart }: { position: OrgPosition; chart: OrgChartData }) {
  const vacant = position.holders.length === 0;
  const coverage = vacant ? coverageFor(position, chart.positions, chart.owners) : null;
  const delegate = position.delegateToId
    ? chart.positions.find((item) => item.id === position.delegateToId)
    : undefined;
  return (
    <li
      aria-label={position.title}
      className={cn(
        "grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        vacant && "bg-warning-50/60 dark:bg-warning-950/40",
      )}
    >
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.8125rem] font-semibold">{position.title}</p>
          <span className="rounded-full border border-(--line-strong) bg-card px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
            {LEVEL_LABEL[position.level] ?? "Staf"}
          </span>
          {vacant ? (
            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[0.625rem] font-semibold text-warning-800">
              Kosong
            </span>
          ) : null}
        </div>
        {vacant ? (
          <p className="text-xs text-muted-foreground">
            Tugas dipegang{" "}
            {coverage?.people.map((person) => person.name).join(", ") || "Direktur Utama"}
            {coverage?.via ? ` (${coverage.via.title})` : " (Direktur Utama)"}
          </p>
        ) : (
          <ul aria-label={`Pemegang ${position.title}`} className="flex flex-wrap gap-1.5">
            {position.holders.map((holder) => (
              <li
                key={holder.id}
                className="inline-flex items-center gap-1 rounded-full border border-(--line-strong) bg-card py-0.5 pr-1 pl-2.5 text-xs"
              >
                {holder.person.name}
                <EndHolderButton holder={holder} position={position} />
              </li>
            ))}
          </ul>
        )}
        {delegate ? (
          <p className="text-[0.6875rem] text-muted-foreground">
            Pelimpahan saat kosong: {delegate.title}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <AssignDialog position={position} employees={chart.employees} />
        {position.parentId ? (
          <DelegateDialog position={position} positions={chart.positions} />
        ) : null}
      </div>
    </li>
  );
}

export function OrgChart({ chart }: { chart: OrgChartData }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {chart.departments.map((department) => {
        const items = chart.positions.filter((position) => position.departmentId === department.id);
        if (items.length === 0) return null;
        return (
          <section
            key={department.id}
            aria-labelledby={`dept-${department.id}`}
            className="overflow-hidden rounded-xl border border-(--line-strong) bg-card"
          >
            <h2
              id={`dept-${department.id}`}
              className="flex items-center gap-2 border-b border-(--line-strong) bg-(--band-soft) px-4 py-2.5 text-sm font-semibold"
            >
              <Icon icon={UserGroupIcon} size={16} />
              {department.name}
            </h2>
            <ul className="divide-y divide-(--line-strong)">
              {items.map((position) => (
                <PositionRow key={position.id} position={position} chart={chart} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
