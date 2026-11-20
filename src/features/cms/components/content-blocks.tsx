import type { ContentBlock } from "../types";

/** Isi konten dari admin, dirender sebagai elemen React biasa (tanpa HTML mentah, aman dari XSS). */
export function ContentBlocks({ blocks }: { blocks: readonly ContentBlock[] }) {
  return (
    <div className="grid max-w-3xl gap-4 text-base leading-relaxed">
      {blocks.map((block, index) => {
        const key = `${block.type}-${String(index)}`;
        if (block.type === "heading") {
          return (
            <h2 key={key} className="mt-4 text-xl font-bold">
              {block.text}
            </h2>
          );
        }
        if (block.type === "sources") {
          return (
            <section key={key} aria-label="Sumber" className="mt-6 border-t pt-4 text-sm">
              <p className="font-semibold">Sumber</p>
              <ul className="mt-2 grid gap-1.5">
                {block.items.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary-800"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={key} className="grid list-disc gap-1.5 pl-6">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{block.text}</p>;
      })}
    </div>
  );
}
