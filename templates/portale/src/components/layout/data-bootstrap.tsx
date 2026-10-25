"use client";

import { useEffect } from "react";
import { copy } from "@/content/it";
import { useDataStore } from "@/store/data-store";
import { onStorageError } from "@/store/persist-storage";
import { SESSION_STORAGE_KEY, useSessionStore } from "@/store/session-store";
import { toast } from "@/components/ui/toast";

let started = false;

/** Carica dati demo e sessione dal browser all'avvio. */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
    if (!started) {
      started = true;
      void Promise.resolve(useSessionStore.persist.rehydrate()).then(() =>
        useSessionStore.setState({ hydrated: true }),
      );
      // L'uscita in una scheda vale per tutte.
      window.addEventListener("storage", (event) => {
        if (event.key === SESSION_STORAGE_KEY) void useSessionStore.persist.rehydrate();
      });
    }
    let warned = false;
    return onStorageError(() => {
      if (warned) return;
      warned = true;
      toast.warning(copy.errors.storage);
    });
  }, []);
  return null;
}
