"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import {
  Clock01Icon,
  Exchange01Icon,
  Note01Icon,
  PlusSignIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { FormDialog, FormDialogFooter } from "@/components/shared/form-dialog";
import { Icon } from "@/components/shared/icon";
import { TextField } from "@/components/shared/text-field";
import { toast } from "@/components/shared/toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_ACTIVITY_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STAGE_LABEL,
  LEAD_STAGES,
  LOGGABLE_ACTIVITIES,
  MANUAL_LEAD_SOURCES,
  type LeadStage,
} from "@/config/crm";
import {
  changeStageAction,
  createLeadAction,
  logActivityAction,
  reassignLeadAction,
  saveCrmSettingsAction,
} from "../actions";
import {
  changeStageSchema,
  createLeadSchema,
  crmSettingsSchema,
  logActivitySchema,
  reassignLeadSchema,
  type ChangeStageInput,
  type CreateLeadInput,
  type CrmSettingsInput,
  type LogActivityInput,
  type ReassignLeadInput,
} from "../schemas";
import type { MarketingChoice } from "../types";

function ServerError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function SelectField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  children,
}: {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="h-11 w-full rounded-md px-3"
          aria-invalid={error ? true : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">{children}</SelectContent>
      </Select>
      <FieldError message={error} />
    </div>
  );
}

export function AddLeadDialog({ projects }: { projects: readonly { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { fullName: "", phone: "", email: "", projectId: null, note: "" },
  });
  const { execute, result, isExecuting, reset } = useAction(createLeadAction, {
    onSuccess({ data }) {
      toast.success("Lead tersimpan.");
      setOpen(false);
      form.reset();
      router.push(`/portal/crm/${data.id}`);
    },
  });
  const close = () => {
    setOpen(false);
    reset();
  };
  const errors = form.formState.errors;
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Tambah lead"
      icon={PlusSignIcon}
      busy={isExecuting}
      trigger={
        <Button type="button" size="sm">
          <Icon icon={PlusSignIcon} size={18} />
          Tambah lead
        </Button>
      }
    >
      <form
        noValidate
        aria-label="Lead baru"
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <TextField
          label="Nama konsumen"
          autoComplete="off"
          error={errors.fullName?.message}
          {...form.register("fullName")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nomor HP"
            inputMode="tel"
            autoComplete="off"
            error={errors.phone?.message}
            {...form.register("phone")}
          />
          <TextField
            label="Email (opsional)"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...form.register("email")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="source"
            render={({ field, fieldState }) => (
              <SelectField
                id="lead-sumber"
                label="Sumber"
                value={field.value}
                onChange={field.onChange}
                placeholder="Pilih"
                error={fieldState.error?.message}
              >
                {MANUAL_LEAD_SOURCES.map((source) => (
                  <SelectItem key={source} value={source} className="min-h-10">
                    {LEAD_SOURCE_LABEL[source]}
                  </SelectItem>
                ))}
              </SelectField>
            )}
          />
          <Controller
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <SelectField
                id="lead-proyek"
                label="Proyek (opsional)"
                value={field.value ?? "tanpa"}
                onChange={(value) => {
                  field.onChange(value === "tanpa" ? null : value);
                }}
                placeholder="Pilih"
              >
                <SelectItem value="tanpa" className="min-h-10">
                  Belum ditentukan
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="min-h-10">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectField>
            )}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lead-catatan">Catatan (opsional)</Label>
          <Textarea id="lead-catatan" rows={3} {...form.register("note")} />
          <FieldError message={errors.note?.message} />
        </div>
        <Controller
          control={form.control}
          name="consent"
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="lead-persetujuan"
                  checked={field.value}
                  onCheckedChange={(next) => {
                    field.onChange(next === true ? true : undefined);
                  }}
                  className="mt-0.5 size-5"
                />
                <Label htmlFor="lead-persetujuan" className="leading-snug font-normal">
                  Konsumen setuju datanya disimpan untuk dihubungi marketing KIS.
                </Label>
              </div>
              <FieldError message={fieldState.error?.message} />
            </div>
          )}
        />
        <ServerError message={result.serverError} />
        <FormDialogFooter busy={isExecuting} onCancel={close} saveLabel="Simpan lead" />
      </form>
    </FormDialog>
  );
}

export function StageDialog({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<ChangeStageInput>({
    resolver: zodResolver(changeStageSchema),
    defaultValues: { leadId, stage, lostReason: "" },
  });
  const chosen = useWatch({ control: form.control, name: "stage" });
  const { execute, result, isExecuting, reset } = useAction(changeStageAction, {
    onSuccess() {
      toast.success("Tahap tersimpan.");
      setOpen(false);
      router.refresh();
    },
  });
  const close = () => {
    setOpen(false);
    reset();
    form.reset({ leadId, stage, lostReason: "" });
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Ubah tahap"
      icon={Task01Icon}
      busy={isExecuting}
      trigger={
        <Button type="button" size="sm" variant="outline">
          <Icon icon={Task01Icon} size={18} />
          Ubah tahap
        </Button>
      }
    >
      <form
        noValidate
        aria-label="Tahap lead"
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <Controller
          control={form.control}
          name="stage"
          render={({ field, fieldState }) => (
            <SelectField
              id="lead-tahap"
              label="Tahap"
              value={field.value}
              onChange={field.onChange}
              placeholder="Pilih"
              error={fieldState.error?.message}
            >
              {LEAD_STAGES.map((item) => (
                <SelectItem key={item} value={item} className="min-h-10">
                  {LEAD_STAGE_LABEL[item]}
                </SelectItem>
              ))}
            </SelectField>
          )}
        />
        {chosen === "batal" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="lead-alasan-batal">Alasan batal</Label>
            <Textarea
              id="lead-alasan-batal"
              rows={3}
              aria-invalid={form.formState.errors.lostReason ? true : undefined}
              {...form.register("lostReason")}
            />
            <FieldError message={form.formState.errors.lostReason?.message} />
          </div>
        ) : null}
        <ServerError message={result.serverError} />
        <FormDialogFooter busy={isExecuting} onCancel={close} saveLabel="Simpan tahap" />
      </form>
    </FormDialog>
  );
}

export function ActivityDialog({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const blank = (): LogActivityInput => ({
    leadId,
    clientId: crypto.randomUUID(),
    type: "telepon",
    body: "",
  });
  const form = useForm<LogActivityInput>({
    resolver: zodResolver(logActivitySchema),
    defaultValues: {
      leadId,
      clientId: "00000000-0000-4000-8000-000000000000",
      type: "telepon",
      body: "",
    },
  });
  const { execute, result, isExecuting, reset } = useAction(logActivityAction, {
    onSuccess() {
      toast.success("Aktivitas tercatat.");
      setOpen(false);
      router.refresh();
    },
  });
  const close = () => {
    setOpen(false);
    reset();
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset(blank());
        setOpen(next);
      }}
      title="Catat aktivitas"
      icon={Note01Icon}
      busy={isExecuting}
      trigger={
        <Button type="button" size="sm">
          <Icon icon={Note01Icon} size={18} />
          Catat aktivitas
        </Button>
      }
    >
      <form
        noValidate
        aria-label="Aktivitas lead"
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <SelectField
              id="aktivitas-jenis"
              label="Jenis"
              value={field.value}
              onChange={field.onChange}
              placeholder="Pilih"
              error={fieldState.error?.message}
            >
              {LOGGABLE_ACTIVITIES.map((item) => (
                <SelectItem key={item} value={item} className="min-h-10">
                  {LEAD_ACTIVITY_LABEL[item]}
                </SelectItem>
              ))}
            </SelectField>
          )}
        />
        <div className="grid gap-1.5">
          <Label htmlFor="aktivitas-hasil">Hasil</Label>
          <Textarea
            id="aktivitas-hasil"
            rows={4}
            aria-invalid={form.formState.errors.body ? true : undefined}
            {...form.register("body")}
          />
          <FieldError message={form.formState.errors.body?.message} />
        </div>
        <ServerError message={result.serverError} />
        <FormDialogFooter busy={isExecuting} onCancel={close} saveLabel="Simpan aktivitas" />
      </form>
    </FormDialog>
  );
}

export function ReassignDialog({
  leadId,
  currentOwnerId,
  marketing,
}: {
  leadId: string;
  currentOwnerId: string | null;
  marketing: readonly MarketingChoice[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<ReassignLeadInput>({
    resolver: zodResolver(reassignLeadSchema),
    defaultValues: { leadId, toUserId: currentOwnerId ?? undefined },
  });
  const { execute, result, isExecuting, reset } = useAction(reassignLeadAction, {
    onSuccess() {
      toast.success("Lead dipindahkan.");
      setOpen(false);
      router.refresh();
    },
  });
  const close = () => {
    setOpen(false);
    reset();
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Pindahkan lead"
      icon={Exchange01Icon}
      busy={isExecuting}
      trigger={
        <Button type="button" size="sm" variant="outline">
          <Icon icon={Exchange01Icon} size={18} />
          {currentOwnerId ? "Pindahkan" : "Bagikan"}
        </Button>
      }
    >
      <form
        noValidate
        aria-label="Pemindahan lead"
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <Controller
          control={form.control}
          name="toUserId"
          render={({ field, fieldState }) => (
            <SelectField
              id="lead-tujuan"
              label="Marketing"
              value={field.value}
              onChange={field.onChange}
              placeholder="Pilih marketing"
              error={fieldState.error?.message}
            >
              {marketing.map((person) => (
                <SelectItem key={person.id} value={person.id} className="min-h-10">
                  {person.name}
                </SelectItem>
              ))}
              {currentOwnerId ? (
                <SelectItem value="antrean" className="min-h-10">
                  Kembalikan ke antrean
                </SelectItem>
              ) : null}
            </SelectField>
          )}
        />
        <ServerError message={result.serverError} />
        <FormDialogFooter busy={isExecuting} onCancel={close} saveLabel="Pindahkan" />
      </form>
    </FormDialog>
  );
}

export function SlaDialog({ minutes }: { minutes: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<CrmSettingsInput>({
    resolver: zodResolver(crmSettingsSchema),
    defaultValues: { slaMinutes: minutes },
  });
  const { execute, result, isExecuting, reset } = useAction(saveCrmSettingsAction, {
    onSuccess() {
      toast.success("Batas respons tersimpan.");
      setOpen(false);
      router.refresh();
    },
  });
  const close = () => {
    setOpen(false);
    reset();
    form.reset({ slaMinutes: minutes });
  };
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="Batas respons"
      description="Lead yang belum dihubungi sampai batas ini kembali ke antrean manajer."
      icon={Clock01Icon}
      busy={isExecuting}
      trigger={
        <Button type="button" size="sm" variant="outline">
          <Icon icon={Clock01Icon} size={18} />
          Batas respons {minutes} menit
        </Button>
      }
    >
      <form
        noValidate
        aria-label="Batas respons lead"
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            execute(values);
          })(event);
        }}
      >
        <TextField
          label="Batas respons (menit)"
          inputMode="numeric"
          error={form.formState.errors.slaMinutes?.message}
          {...form.register("slaMinutes", {
            setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
          })}
        />
        <ServerError message={result.serverError} />
        <FormDialogFooter busy={isExecuting} onCancel={close} />
      </form>
    </FormDialog>
  );
}
