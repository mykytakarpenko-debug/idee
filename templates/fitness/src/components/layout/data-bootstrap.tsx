"use client";

import { useEffect } from "react";
import { copy } from "@/content/it";
import { useDataStore } from "@/store/data-store";
import { onStorageError } from "@/store/persist-storage";
import { useSessionStore } from "@/store/session-store";
import { toast } from "@/components/ui/toast";

/** Carica dati e sessione demo dal browser all'avvio (sito, area socio e pannello). */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
    void Promise.resolve(useSessionStore.persist.rehydrate()).then(() =>
      useSessionStore.setState({ hydrated: true }),
    );
    let warned = false;
    return onStorageError(() => {
      if (warned) return;
      warned = true;
      toast.warning(copy.errors.storage);
    });
  }, []);
  return null;
}
