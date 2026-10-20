"use client";

import { toISODate } from "@/lib/domain/dates";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { useStaticCatalog } from "@/components/layout/catalog-provider";
import { useData, useDataReady } from "./use-data";
import { useNow } from "./use-now";

/**
 * Catalogo pubblico (impostazioni, categorie, laboratori, prodotti, recensioni).
 * Sul server e prima del caricamento usa il catalogo prerenderizzato: l'HTML
 * contiene già nomi, prezzi e descrizioni (SEO); poi legge lo store.
 */
export function useCatalog() {
  const ready = useDataReady();
  const fallback = useStaticCatalog();
  const store = useData((state) => ({
    settings: state.settings,
    categories: state.categories,
    sellers: state.sellers,
    products: state.products,
    reviews: state.reviews,
  }));
  if (ready) return { ...store, ready };
  if (fallback) return { ...fallback, ready };
  return { ...store, settings: DEMO_SETTINGS, ready };
}

/** Data di oggi: nel browser quella reale, sul server quella del prerendering. */
export function useToday(): string {
  const now = useNow();
  const fallback = useStaticCatalog();
  return now ? toISODate(now) : (fallback?.today ?? "1970-01-01");
}
