import { ChevronDown } from "lucide-react";
import type { Faq } from "../types";

/** Tanya jawab dengan details/summary: bisa dibuka tanpa JavaScript, panah berputar saat dibuka. */
export function FaqList({ items }: { items: readonly Faq[] }) {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="px-5 pb-4 text-subtle-foreground motion-safe:group-open:animate-[fade-in_250ms_ease-out]">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
