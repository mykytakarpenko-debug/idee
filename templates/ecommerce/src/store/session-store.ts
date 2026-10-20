"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Sessione dell'area personale (solo demo).
 * In produzione l'identità arriva da un provider di autenticazione con cookie
 * HttpOnly: non salvare mai token o dati di accesso nel localStorage.
 */
interface SessionState {
  hydrated: boolean;
  customerId: string | null;
  signIn: (customerId: string) => void;
  signOut: () => void;
}

export const SESSION_STORAGE_KEY = "bottega:session";

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      customerId: null,
      signIn: (customerId) => set({ customerId }),
      signOut: () => set({ customerId: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ customerId: state.customerId }),
    },
  ),
);
