"use client";

import { STATIC_SITE } from "@/lib/demo/seed";
import { useData, useDataReady } from "./use-data";

/**
 * Dati pubblici del club (corsi, palinsesto, piani, impostazioni).
 * Durante il rendering sul server e prima del caricamento usa i dati statici:
 * così l'HTML contiene già tutti i testi (SEO) e non c'è sfarfallio.
 */
export function useSiteData() {
  const ready = useDataReady();
  const store = useData((state) => ({
    courses: state.courses,
    instructors: state.instructors,
    slots: state.slots,
    plans: state.plans,
    settings: state.settings,
  }));
  if (!ready) return { ...STATIC_SITE, ready };
  return { ...store, ready };
}
