"use client";

import { useEffect } from "react";
import { copy } from "@/content/it";
import { useCartStore } from "@/store/cart-store";
import { useDataStore } from "@/store/data-store";
import { onStorageError } from "@/store/persist-storage";
import { toast } from "@/components/ui/toast";

/** Carica dati e carrello dal browser all'avvio (sito e pannello). */
export function DataBootstrap() {
  useEffect(() => {
    void useDataStore.getState().init();
    void Promise.resolve(useCartStore.persist.rehydrate()).then(() =>
      useCartStore.setState({ hydrated: true }),
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
