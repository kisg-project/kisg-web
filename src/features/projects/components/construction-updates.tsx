import Image from "next/image";
import { Reveal } from "@/components/shared/reveal";
import { formatDateWIB } from "@/lib/format";
import type { ConstructionUpdate } from "../types";

/** Linimasa progres pembangunan yang sudah disetujui dan terbit. */
export function ConstructionUpdates({ items }: { items: readonly ConstructionUpdate[] }) {
  return (
    <ol className="relative grid gap-6 border-l-2 border-primary-100 pl-6">
      {items.map((item, index) => (
        <li key={item.id}>
          <Reveal delay={index * 60}>
            <span
              aria-hidden="true"
              className="absolute -left-[0.4375rem] mt-1.5 size-3 rounded-sm bg-highlight"
            />
            <p className="text-xs font-semibold text-muted-foreground">
              <time dateTime={item.publishedAt}>{formatDateWIB(item.publishedAt)}</time>
            </p>
            <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
            {item.body ? <p className="mt-1 text-subtle-foreground">{item.body}</p> : null}
            {item.cover ? (
              <div className="relative mt-3 aspect-[16/9] max-w-xl overflow-hidden rounded-lg">
                <Image
                  src={item.cover.src}
                  alt={item.cover.alt}
                  fill
                  sizes="(min-width: 640px) 36rem, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
