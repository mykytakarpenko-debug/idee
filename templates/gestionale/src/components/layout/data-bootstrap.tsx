"use client";

import { useEffect } from "react";
import { useDataStore } from "@/store/data-store";

/** Carica i dati salvati nel browser (pagine fuori dalla shell, es. stampa). */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
  }, []);
  return null;
}
