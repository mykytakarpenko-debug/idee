"use client";

import { useEffect } from "react";
import { copy } from "@/content/it";
import { useDataStore } from "@/store/data-store";
import { onStorageError } from "@/store/persist-storage";
import { toast } from "@/components/ui/toast";

/** Carica i dati demo dal browser all'avvio (pagina pubblica, widget e pannello). */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
    let warned = false;
    return onStorageError(() => {
      if (warned) return;
      warned = true;
      toast.warning(copy.errors.storage);
    });
  }, []);
  return null;
}
