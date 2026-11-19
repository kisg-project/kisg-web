import { serializeJsonLd } from "@/lib/seo/structured-data";

/** Menyisipkan data terstruktur JSON-LD. Isi di-escape oleh serializeJsonLd. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Konten berasal dari data internal yang sudah diserialisasi aman (karakter < di-escape).
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
