"use client";

import { routes } from "@/config/navigation";
import { useDataStore } from "@/store/data-store";

/** Contatori accanto alle voci del pannello: nuove richieste di prova. */
export function useNavCounts(): Record<string, number> {
  const newTrials = useDataStore((state) => state.trials.filter((t) => t.status === "new").length);
  return { [routes.panel]: newTrials };
}
