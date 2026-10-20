"use client";

import { STATIC_SITE } from "@/lib/demo/seed";
import { useData, useDataReady } from "./use-data";

/**
 * Dati pubblici dello studio (servizi, team, orari). Sul server e prima del
 * caricamento usa i dati statici: l'HTML contiene già tutti i testi (SEO).
 */
export function useSiteData() {
  const ready = useDataReady();
  const store = useData((state) => ({
    categories: state.categories,
    services: state.services,
    staff: state.staff,
    hours: state.hours,
    settings: state.settings,
  }));
  if (!ready) return { ...STATIC_SITE, ready };
  return { ...store, ready };
}
