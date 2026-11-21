"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePostAction } from "../actions/content";
import { postSchema, type PostInput } from "../schemas/content";
import { slugify } from "../utils/slug";
import { BlockEditor, cleanBlocks } from "./block-editor";
import { CoverUploader } from "./cover-uploader";
import { StatusField } from "./status-field";

/** Form berita di panel CMS. Slug mengikuti judul sampai diubah manual. */
export function PostForm({ initial }: { initial?: PostInput & { id: string } }) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: initial ?? {
      title: "",
      slug: "",
      excerpt: "",
      coverPath: null,
      coverAlt: "",
      body: [{ type: "paragraph", text: "" }],
      status: "draft",
    },
  });
  const excerpt = useWatch({ control: form.control, name: "excerpt" });
  const { execute, result, isExecuting } = useAction(savePostAction, {
    onSuccess({ data }) {
      toast.success(initial ? "Perubahan berita tersimpan." : "Berita tersimpan.");
      if (!initial) router.replace(`/cms/berita/${data.id}`);
      router.refresh();
    },
  });
  const titleField = form.register("title");

  return (
    <form
      noValidate
      aria-label="Form berita"
      className="grid gap-6"
      onSubmit={(event) => {
        void form.handleSubmit((values) => {
          execute({ ...values, id: initial?.id, body: cleanBlocks(values.body) });
        })(event);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Judul"
          error={form.formState.errors.title?.message}
          {...titleField}
          onChange={(event) => {
            void titleField.onChange(event);
            if (!slugTouched) {
              form.setValue("slug", slugify(event.target.value), { shouldValidate: false });
            }
          }}
        />
        <TextField
          label="Slug (alamat halaman)"
          hint="Contoh: kpr-flpp-2026. Muncul di alamat /berita/slug."
          error={form.formState.errors.slug?.message}
          {...form.register("slug", {
            onChange: () => {
              setSlugTouched(true);
            },
          })}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="berita-ringkasan">Ringkasan</Label>
        <Textarea
          id="berita-ringkasan"
          rows={3}
          aria-invalid={form.formState.errors.excerpt ? true : undefined}
          aria-describedby="berita-ringkasan-info"
          {...form.register("excerpt")}
        />
        <p id="berita-ringkasan-info" className="text-xs text-muted-foreground">
          {excerpt.length}/160 karakter. Tampil di kartu berita dan hasil pencarian Google.
        </p>
        {form.formState.errors.excerpt ? (
          <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
        ) : null}
      </div>
      <Controller
        control={form.control}
        name="coverPath"
        render={({ field }) => (
          <CoverUploader folder="berita" value={field.value ?? null} onChange={field.onChange} />
        )}
      />
      <TextField
        label="Teks alternatif sampul"
        hint="Jelaskan isi gambar dalam satu kalimat. Contoh: Foto ilustrasi kalkulator dan dokumen."
        error={form.formState.errors.coverAlt?.message}
        {...form.register("coverAlt")}
      />
      <Controller
        control={form.control}
        name="body"
        render={({ field, fieldState }) => (
          <BlockEditor
            label="Isi berita"
            allowSources
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message ?? form.formState.errors.body?.root?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <StatusField
            id="berita-status"
            value={field.value}
            onChange={field.onChange}
            hint="Terbit: tampil di website. Draf: hanya terlihat di panel CMS."
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
          {isExecuting ? "Menyimpan" : "Simpan berita"}
        </Button>
      </div>
    </form>
  );
}
