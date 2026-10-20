"use client";

import { DEMO_SETTINGS, STATIC_MENU } from "@/lib/demo/seed";
import { useData, useDataReady } from "./use-data";

/**
 * Dati pubblici del locale (menu e impostazioni).
 * Durante il rendering sul server e prima del caricamento usa il menu statico:
 * così l'HTML contiene già tutti i testi (SEO) e non c'è sfarfallio.
 * In produzione questi dati arriveranno dal database lato server.
 */
export function useSiteData() {
  const ready = useDataReady();
  const store = useData((state) => ({
    categories: state.categories,
    dishes: state.dishes,
    settings: state.settings,
  }));
  if (!ready) return { ...STATIC_MENU, settings: DEMO_SETTINGS, ready };
  return { ...store, ready };
}
