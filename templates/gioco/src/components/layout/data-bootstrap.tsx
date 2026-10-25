"use client";

import { useEffect } from "react";
import { copy } from "@/content/it";
import { useDataStore } from "@/store/data-store";
import { onStorageError } from "@/store/persist-storage";
import { SESSION_STORAGE_KEY, useSessionStore } from "@/store/session-store";
import { SLIP_STORAGE_KEY, useSlipStore } from "@/store/slip-store";
import { toast } from "@/components/ui/toast";

let started = false;

/** Carica dati demo, schedina e sessione dal browser all'avvio (sito e pannello). */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
    if (!started) {
      started = true;
      void Promise.resolve(useSlipStore.persist.rehydrate()).then(() =>
        useSlipStore.setState({ hydrated: true }),
      );
      void Promise.resolve(useSessionStore.persist.rehydrate()).then(() =>
        useSessionStore.setState({ hydrated: true }),
      );
      // Schedina e accesso condivisi tra le schede aperte; l'uscita vale ovunque.
      window.addEventListener("storage", (event) => {
        if (event.key === SLIP_STORAGE_KEY) void useSlipStore.persist.rehydrate();
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
