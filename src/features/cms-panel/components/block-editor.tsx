"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, Heading2, Link2, List, Pilcrow, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentBlock } from "@/features/cms/types";

const TYPE_LABEL: Record<ContentBlock["type"], string> = {
  paragraph: "Paragraf",
  heading: "Subjudul",
  list: "Daftar",
  sources: "Sumber",
};

function emptyBlock(type: ContentBlock["type"]): ContentBlock {
  if (type === "list") return { type, items: [""] };
  if (type === "sources") return { type, items: [{ label: "", url: "https://" }] };
  return { type, text: "" };
}

/**
 * Editor isi konten berbasis blok (paragraf, subjudul, daftar, sumber). Disimpan sebagai jsonb dan
 * dirender halaman publik tanpa HTML mentah, jadi aman dari XSS. Blok bisa diurutkan dan dihapus.
 */
export function BlockEditor({
  label,
  value,
  onChange,
  error,
  allowSources = false,
}: {
  label: string;
  value: ContentBlock[];
  onChange: (next: ContentBlock[]) => void;
  error?: string;
  allowSources?: boolean;
}) {
  const id = useId();
  const update = (index: number, block: ContentBlock) => {
    onChange(value.map((item, position) => (position === index ? block : item)));
  };
  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (item) next.splice(target, 0, item);
    onChange(next);
  };
  const remove = (index: number) => {
    onChange(value.filter((_, position) => position !== index));
  };
  const types: ContentBlock["type"][] = allowSources
    ? ["paragraph", "heading", "list", "sources"]
    : ["paragraph", "heading", "list"];

  return (
    <fieldset className="grid gap-3" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {value.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Belum ada isi. Tambah paragraf pertama dengan tombol di bawah.
        </p>
      ) : null}
      <ol className="grid gap-3">
        {value.map((block, index) => {
          const blockId = `${id}-${String(index)}`;
          const name = `${TYPE_LABEL[block.type]} ${String(index + 1)}`;
          return (
            <li
              key={blockId}
              aria-label={name}
              className="grid gap-2 rounded-lg border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-subtle-foreground uppercase">
                  {name}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Naikkan ${name}`}
                    disabled={index === 0}
                    onClick={() => {
                      move(index, -1);
                    }}
                  >
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Turunkan ${name}`}
                    disabled={index === value.length - 1}
                    onClick={() => {
                      move(index, 1);
                    }}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus ${name}`}
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
              {block.type === "paragraph" ? (
                <>
                  <Label htmlFor={blockId} className="sr-only">
                    Teks {name}
                  </Label>
                  <Textarea
                    id={blockId}
                    rows={4}
                    value={block.text}
                    onChange={(event) => {
                      update(index, { type: "paragraph", text: event.target.value });
                    }}
                  />
                </>
              ) : null}
              {block.type === "heading" ? (
                <>
                  <Label htmlFor={blockId} className="sr-only">
                    Teks {name}
                  </Label>
                  <Input
                    id={blockId}
                    className="h-11 font-semibold"
                    value={block.text}
                    onChange={(event) => {
                      update(index, { type: "heading", text: event.target.value });
                    }}
                  />
                </>
              ) : null}
              {block.type === "list" ? (
                <>
                  <Label htmlFor={blockId} className="text-xs text-muted-foreground">
                    Satu poin per baris
                  </Label>
                  <Textarea
                    id={blockId}
                    rows={4}
                    value={block.items.join("\n")}
                    onChange={(event) => {
                      update(index, { type: "list", items: event.target.value.split("\n") });
                    }}
                  />
                </>
              ) : null}
              {block.type === "sources" ? (
                <div className="grid gap-2">
                  {block.items.map((source, sourceIndex) => {
                    const sourceId = `${blockId}-${String(sourceIndex)}`;
                    const setSource = (patch: Partial<typeof source>) => {
                      update(index, {
                        type: "sources",
                        items: block.items.map((item, position) =>
                          position === sourceIndex ? { ...item, ...patch } : item,
                        ),
                      });
                    };
                    return (
                      <div key={sourceId} className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-1">
                          <Label htmlFor={`${sourceId}-label`} className="text-xs">
                            Nama sumber {sourceIndex + 1}
                          </Label>
                          <Input
                            id={`${sourceId}-label`}
                            className="h-11"
                            value={source.label}
                            onChange={(event) => {
                              setSource({ label: event.target.value });
                            }}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label htmlFor={`${sourceId}-url`} className="text-xs">
                            Tautan sumber {sourceIndex + 1}
                          </Label>
                          <Input
                            id={`${sourceId}-url`}
                            type="url"
                            inputMode="url"
                            className="h-11"
                            value={source.url}
                            onChange={(event) => {
                              setSource({ url: event.target.value });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        update(index, {
                          type: "sources",
                          items: [...block.items, { label: "", url: "https://" }],
                        });
                      }}
                    >
                      <Plus aria-hidden="true" />
                      Tambah sumber
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const Icon =
            type === "paragraph"
              ? Pilcrow
              : type === "heading"
                ? Heading2
                : type === "list"
                  ? List
                  : Link2;
          return (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange([...value, emptyBlock(type)]);
              }}
            >
              <Icon aria-hidden="true" />
              Tambah {TYPE_LABEL[type].toLowerCase()}
            </Button>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Bersihkan blok sebelum disimpan: buang baris daftar kosong dan blok kosong. */
export function cleanBlocks(blocks: readonly ContentBlock[]): ContentBlock[] {
  return blocks.flatMap((block): ContentBlock[] => {
    if (block.type === "list") {
      const items = block.items.map((item) => item.trim()).filter(Boolean);
      return items.length > 0 ? [{ type: "list", items }] : [];
    }
    if (block.type === "sources") {
      const items = block.items
        .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
        .filter((item) => item.label && item.url && item.url !== "https://");
      return items.length > 0 ? [{ type: "sources", items }] : [];
    }
    const text = block.text.trim();
    return text ? [{ type: block.type, text }] : [];
  });
}
