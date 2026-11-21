"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProjectImage } from "../types";

/**
 * Galeri foto proyek: kisi foto yang memperbesar halus saat di-hover, klik membuka tampilan penuh
 * dengan tombol sebelumnya/berikutnya dan tombol panah keyboard.
 */
export function ProjectGallery({
  images,
  projectName,
}: {
  images: ProjectImage[];
  projectName: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? undefined : images[open];
  const go = (step: number) => {
    setOpen((index) => (index === null ? index : (index + step + images.length) % images.length));
  };

  return (
    <>
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        aria-label={`Galeri ${projectName}`}
      >
        {images.map((image, index) => (
          <li
            key={image.id}
            className={cn(index === 0 && "col-span-2 row-span-2 sm:col-span-2 lg:col-span-2")}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(index);
              }}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-3xl bg-surface"
              aria-label={`Perbesar foto: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={
                  index === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"
                }
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-primary-950/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand aria-hidden="true" className="size-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={current !== undefined}
        onOpenChange={(value) => {
          if (!value) setOpen(null);
        }}
      >
        <DialogContent
          className="max-w-[min(64rem,calc(100vw-2rem))] gap-3 p-3 sm:p-4"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
          }}
        >
          {current ? (
            <>
              <DialogTitle className="pr-10 text-base">{current.alt}</DialogTitle>
              <DialogDescription className="sr-only">
                Foto {(open ?? 0) + 1} dari {images.length}. Gunakan tombol panah untuk berpindah
                foto.
              </DialogDescription>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface sm:aspect-[16/10]">
                <Image
                  key={current.id}
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="(min-width: 1024px) 64rem, 100vw"
                  className="object-contain motion-safe:animate-[fade-in_300ms_ease-out]"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    go(-1);
                  }}
                >
                  <ChevronLeft aria-hidden="true" />
                  Sebelumnya
                </Button>
                <p className="text-sm text-muted-foreground tabular">
                  {(open ?? 0) + 1} / {images.length}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    go(1);
                  }}
                >
                  Berikutnya
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
