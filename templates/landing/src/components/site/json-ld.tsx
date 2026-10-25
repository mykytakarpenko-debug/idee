import { serializeJsonLd } from "@/lib/seo";

/** Dati strutturati nella pagina (contenuto generato da noi, mai dagli utenti). */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
