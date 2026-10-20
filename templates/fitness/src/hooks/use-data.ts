"use client";

import { useShallow } from "zustand/react/shallow";
import { useDataStore, type DataState } from "@/store/data-store";

export function useData<T>(selector: (state: DataState) => T): T {
  return useDataStore(useShallow(selector));
}

export function useDataReady(): boolean {
  return useDataStore((state) => state.ready);
}
