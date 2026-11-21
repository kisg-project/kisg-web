"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAREER_LEVELS } from "@/config/careers";
import { saveCareerAction } from "../actions/content";
import { careerSchema, type CareerInput } from "../schemas/content";
import { slugify } from "../utils/slug";
import { BlockEditor, cleanBlocks } from "./block-editor";
import { StatusField } from "./status-field";

/** Form lowongan di panel CMS, termasuk jenjang untuk halaman karir. */
export function CareerForm({ initial }: { initial?: CareerInput & { id: string } }) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [requirementsText, setRequirementsText] = useState(
    (initial?.requirements ?? []).join("\n"),
  );
  const form = useForm<CareerInput>({
    resolver: zodResolver(careerSchema),
    defaultValues: initial ?? {
      title: "",
      slug: "",
      department: "",
      location: "Bekasi",
      employmentType: "Penuh waktu",
      level: "berpengalaman",
      closesOn: "",
      description: [{ type: "paragraph", text: "" }],
      requirements: [],
      status: "draft",
    },
  });
  const { execute, result, isExecuting } = useAction(saveCareerAction, {
    onSuccess({ data }) {
      toast.success(initial ? "Perubahan lowongan tersimpan." : "Lowongan tersimpan.");
      if (!initial) router.replace(`/cms/lowongan/${data.id}`);
      router.refresh();
    },
  });
  const titleField = form.register("title");

  return (
    <form
      noValidate
      aria-label="Form lowongan"
      className="grid gap-6"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute({
            ...values,
            id: initial?.id,
            description: cleanBlocks(values.description),
            requirements: requirementsText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
          });
        })(event);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Posisi"
          error={form.formState.errors.title?.message}
          {...titleField}
          onChange={(event) => {
            void titleField.onChange(event);
            if (!slugTouched) form.setValue("slug", slugify(event.target.value));
          }}
        />
        <TextField
          label="Slug (alamat halaman)"
          hint="Muncul di alamat /karir/slug."
          error={form.formState.errors.slug?.message}
          {...form.register("slug", {
            onChange: () => {
              setSlugTouched(true);
            },
          })}
        />
        <TextField
          label="Divisi"
          error={form.formState.errors.department?.message}
          {...form.register("department")}
        />
        <TextField
          label="Lokasi kerja"
          error={form.formState.errors.location?.message}
          {...form.register("location")}
        />
        <TextField
          label="Jenis pekerjaan"
          hint="Contoh: Penuh waktu, Kontrak, Magang."
          error={form.formState.errors.employmentType?.message}
          {...form.register("employmentType")}
        />
        <TextField
          label="Ditutup pada (opsional)"
          type="date"
          error={form.formState.errors.closesOn?.message}
          {...form.register("closesOn")}
        />
      </div>
      <Controller
        control={form.control}
        name="level"
        render={({ field, fieldState }) => (
          <div className="flex min-w-0 flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="lowongan-jenjang">Jenjang</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="lowongan-jenjang"
                className="h-11 w-full rounded-md px-3"
                aria-invalid={fieldState.error ? true : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {CAREER_LEVELS.map((item) => (
                  <SelectItem key={item.level} value={item.level} className="min-h-10">
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Lowongan tampil di kartu jenjang ini.</p>
          </div>
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <BlockEditor
            label="Deskripsi pekerjaan"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message ?? form.formState.errors.description?.root?.message}
          />
        )}
      />
      <div className="grid gap-1.5">
        <Label htmlFor="lowongan-syarat">Persyaratan</Label>
        <Textarea
          id="lowongan-syarat"
          rows={5}
          aria-describedby="lowongan-syarat-info"
          value={requirementsText}
          onChange={(event) => {
            setRequirementsText(event.target.value);
          }}
        />
        <p id="lowongan-syarat-info" className="text-xs text-muted-foreground">
          Satu syarat per baris.
        </p>
      </div>
      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <StatusField
            id="lowongan-status"
            value={field.value}
            onChange={field.onChange}
            hint="Terbit: tampil di halaman karir sampai tanggal tutup."
          />
        )}
      />
      {result.serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {result.serverError}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" disabled={isExecuting}>
          {isExecuting ? "Menyimpan" : "Simpan lowongan"}
        </Button>
      </div>
    </form>
  );
}
