import type { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * Archivio locale per zustand/persist con scrittura ritardata.
 *
 * - Serializza e salva al massimo una volta ogni `delay` ms (il dataset demo
 *   pesa ~2 MB: scriverlo a ogni modifica rallenterebbe l'interfaccia).
 * - Forza il salvataggio quando la pagina viene nascosta o chiusa.
 * - Gestisce gli errori (quota superata, modalità privata) senza bloccare l'app.
 *
 * Collegando un backend reale questo modulo non serve più: i dati arrivano dal server.
 */

type ErrorListener = (error: unknown) => void;
const errorListeners = new Set<ErrorListener>();

export function onStorageError(listener: ErrorListener): () => void {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

function getLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createDebouncedStorage<S>(delay = 400): PersistStorage<S> {
  const pending = new Map<string, StorageValue<S>>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const storage = getLocalStorage();
    if (!storage) return;
    for (const [name, value] of pending) {
      try {
        storage.setItem(name, JSON.stringify(value));
      } catch (error) {
        errorListeners.forEach((listener) => listener(error));
      }
    }
    pending.clear();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem(name) {
      const queued = pending.get(name);
      if (queued) return queued;
      const raw = getLocalStorage()?.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<S>;
      } catch {
        return null;
      }
    },
    setItem(name, value) {
      pending.set(name, value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    removeItem(name) {
      pending.delete(name);
      try {
        getLocalStorage()?.removeItem(name);
      } catch {
        // archivio non disponibile: niente da rimuovere
      }
    },
  };
}
