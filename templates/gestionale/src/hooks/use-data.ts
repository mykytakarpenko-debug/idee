"use client";

import { useShallow } from "zustand/react/shallow";
import { useDataStore, type DataState } from "@/store/data-store";

/** Selettore tipizzato sullo store dei dati (confronto superficiale). */
export function useData<T>(selector: (state: DataState) => T): T {
  return useDataStore(useShallow(selector));
}

/** true quando i dati sono stati caricati nel browser. */
export function useDataReady(): boolean {
  return useDataStore((state) => state.ready);
}

/** Azioni dello store (riferimenti stabili). */
export function useDataActions() {
  return useDataStore.getState();
}
