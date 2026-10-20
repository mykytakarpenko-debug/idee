"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Ora corrente, aggiornata ogni 30 secondi e condivisa tra i componenti.
 *
 * Restituisce `null` durante il rendering sul server e la prima idratazione:
 * l'ora "adesso" non deve finire nell'HTML statico (con Cache Components il
 * prerender fallirebbe) e cambierebbe tra server e browser.
 */
const listeners = new Set<() => void>();
let current = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  current = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(tick, 30_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (current === 0) current = Date.now();
  return current;
}

function getServerSnapshot() {
  return 0;
}

export function useNow(): Date | null {
  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (ms === 0 ? null : new Date(ms)), [ms]);
}
