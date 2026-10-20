import { cacheLife } from "next/cache";
import { catalogAt } from "@/lib/demo/seed";
import { toISODate } from "@/lib/domain/dates";

/**
 * Catalogo per il prerendering (server). Calcolato una volta e riutilizzato:
 * le pagine prodotto sono HTML statico con prezzi, disponibilità e dati
 * strutturati; nel browser i dati si aggiornano dallo store.
 * In produzione qui leggi dal database o dal CMS e rigeneri con revalidateTag.
 */
export async function getCatalog() {
  "use cache";
  cacheLife("hours");
  const today = toISODate(new Date());
  return { today, ...catalogAt(today) };
}

export type StaticCatalog = Awaited<ReturnType<typeof getCatalog>>;
