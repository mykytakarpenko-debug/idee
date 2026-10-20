"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Sessione dell'area socio (solo demo).
 * In produzione l'identità arriva da un provider di autenticazione con cookie
 * HttpOnly: non salvare mai token o dati di accesso nel localStorage.
 */
interface SessionState {
  hydrated: boolean;
  memberId: string | null;
  signIn: (memberId: string) => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      memberId: null,
      signIn: (memberId) => set({ memberId }),
      signOut: () => set({ memberId: null }),
    }),
    {
      name: "forma:session",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ memberId: state.memberId }),
    },
  ),
);
