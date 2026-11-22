"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { ConfirmDialog, FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { toast } from "@/components/shared/toast";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAYS } from "@/config/attendance";
import { deleteScheduleAction, saveScheduleAction } from "../actions/attendance";
import { scheduleSchema, type ScheduleInput } from "../schemas/attendance";
import { Clock01Icon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export interface Choice {
  id: string;
  name: string;
}

const SCOPE_LABEL = {
  perusahaan: "Semua karyawan (default)",
  lokasi: "Per titik absensi",
  karyawan: "Per karyawan",
} as const;

export function ScheduleForm({
  initial,
  locations,
  employees,
  fixedScope,
  onDone,
  onCancel,
}: {
  initial?: ScheduleInput;
  locations: readonly Choice[];
  employees: readonly Choice[];
  fixedScope?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: initial ?? {
      scope: "lokasi",
      targetId: null,
      startTime: "08:00",
      endTime: "17:00",
      workdays: [1, 2, 3, 4, 5, 6],
      lateToleranceMin: 15,
    },
  });
  const scope = useWatch({ control: form.control, name: "scope" });
  const { execute, result, isExecuting } = useAction(saveScheduleAction, {
    onSuccess() {
      toast.success("Jam kerja tersimpan.");
      if (!fixedScope) form.reset();
      onDone?.();
      router.refresh();
    },
  });
  const choices = scope === "lokasi" ? locations : employees;
  const idPrefix = fixedScope ? "jam-perusahaan" : "jam-khusus";

  return (
    <form
      noValidate
      aria-label={fixedScope ? "Jam kerja perusahaan" : "Jam kerja khusus"}
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute(values);
        })(event);
      }}
    >
      {fixedScope ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="scope"
            render={({ field }) => (
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-lingkup`}>Berlaku untuk</Label>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("targetId", null);
                  }}
                >
                  <SelectTrigger id={`${idPrefix}-lingkup`} className="h-11 w-full rounded-md px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="lokasi" className="min-h-10">
                      {SCOPE_LABEL.lokasi}
                    </SelectItem>
                    <SelectItem value="karyawan" className="min-h-10">
                      {SCOPE_LABEL.karyawan}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="targetId"
            render={({ field, fieldState }) => (
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-target`}>
                  {scope === "lokasi" ? "Titik absensi" : "Karyawan"}
                </Label>
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={`${idPrefix}-target`}
                    className="h-11 w-full rounded-md px-3"
                    aria-invalid={fieldState.error ? true : undefined}
                  >
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {choices.map((choice) => (
                      <SelectItem key={choice.id} value={choice.id} className="min-h-10">
                        {choice.name}
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
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Jam masuk"
          type="time"
          error={form.formState.errors.startTime?.message}
          {...form.register("startTime")}
        />
        <TextField
          label="Jam pulang"
          type="time"
          error={form.formState.errors.endTime?.message}
          {...form.register("endTime")}
        />
        <TextField
          label="Toleransi terlambat (menit)"
          inputMode="numeric"
          error={form.formState.errors.lateToleranceMin?.message}
          {...form.register("lateToleranceMin", {
            setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
          })}
        />
      </div>
      <Controller
        control={form.control}
        name="workdays"
        render={({ field, fieldState }) => (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Hari kerja</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const id = `${idPrefix}-hari-${String(day.value)}`;
                const checked = field.value.includes(day.value);
                return (
                  <div
                    key={day.value}
                    className="flex min-h-11 items-center gap-2 rounded-2xl bg-surface px-3"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(next) => {
                        field.onChange(
                          next === true
                            ? [...field.value, day.value]
                            : field.value.filter((value) => value !== day.value),
                        );
                      }}
                      className="size-5"
                    />
                    <Label htmlFor={id} className="font-normal">
                      {day.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            {fieldState.error ? (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            ) : null}
          </fieldset>
        )}
      />
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      {onCancel ? (
        <FormDialogFooter busy={isExecuting} onCancel={onCancel} />
      ) : (
        <div>
          <Button type="submit" variant="save" disabled={isExecuting}>
            {isExecuting ? "Menyimpan" : "Simpan jam kerja"}
          </Button>
        </div>
      )}
    </form>
  );
}

export function DeleteScheduleButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { execute, isExecuting, result } = useAction(deleteScheduleAction, {
    onSuccess() {
      setOpen(false);
      toast.success("Jam kerja khusus dihapus.");
      router.refresh();
    },
  });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={`Hapus jam kerja ${name}?`}
      description="Jam kerja kembali mengikuti jam kerja perusahaan."
      confirmLabel="Ya, hapus"
      busyLabel="Menghapus"
      icon={Delete02Icon}
      busy={isExecuting}
      error={result.serverError}
      onConfirm={() => {
        execute({ id });
      }}
      trigger={
        <Button type="button" variant="ghost" size="icon" aria-label={`Hapus jam kerja ${name}`}>
          <Icon icon={Delete02Icon} aria-hidden="true" />
        </Button>
      }
    />
  );
}

export function ScheduleDialog({
  locations,
  employees,
}: {
  locations: readonly Choice[];
  employees: readonly Choice[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Tambah jam khusus"
      icon={Clock01Icon}
      description="Jam karyawan mengalahkan jam titik absensi. Jam titik mengalahkan jam perusahaan."
      trigger={
        <Button type="button">
          <Icon icon={PlusSignIcon} aria-hidden="true" />
          Tambah jam khusus
        </Button>
      }
    >
      <ScheduleForm locations={locations} employees={employees} onDone={close} onCancel={close} />
    </FormDialog>
  );
}
