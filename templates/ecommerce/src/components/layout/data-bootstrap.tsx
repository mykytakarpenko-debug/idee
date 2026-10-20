"use client";

import { useEffect } from "react";
import { copy } from "@/content/it";
import { CART_STORAGE_KEY, useCartStore } from "@/store/cart-store";
import { useDataStore } from "@/store/data-store";
import { onStorageError } from "@/store/persist-storage";
import { SESSION_STORAGE_KEY, useSessionStore } from "@/store/session-store";
import { toast } from "@/components/ui/toast";

let started = false;

/** Carica dati demo, carrello e sessione dal browser all'avvio (negozio e pannello). */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
    if (!started) {
      started = true;
      void Promise.resolve(useCartStore.persist.rehydrate()).then(() =>
        useCartStore.setState({ hydrated: true }),
      );
      void Promise.resolve(useSessionStore.persist.rehydrate()).then(() =>
        useSessionStore.setState({ hydrated: true }),
      );
      // Carrello e accesso condivisi tra le schede aperte.
      window.addEventListener("storage", (event) => {
        if (event.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
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
