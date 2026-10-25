"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Sessione del conto di gioco (solo demo).
 * In produzione l'identità arriva da un provider di autenticazione con cookie
 * HttpOnly e la sessione di gioco è tracciata dal server.
 */
export type SessionNotice = "signed_out" | "session_limit" | null;

interface SessionState {
  hydrated: boolean;
  playerId: string | null;
  sessionId: string | null;
  /** Ultimo promemoria del tempo di gioco mostrato (ms). */
  lastRealityCheck: number | null;
  notice: SessionNotice;
  signIn: (playerId: string, sessionId: string) => void;
  signOut: (notice?: SessionNotice) => void;
  markRealityCheck: (at: number) => void;
  clearNotice: () => void;
}

export const SESSION_STORAGE_KEY = "arena:session";

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      playerId: null,
      sessionId: null,
      lastRealityCheck: null,
      notice: null,
      signIn: (playerId, sessionId) =>
        set({ playerId, sessionId, lastRealityCheck: null, notice: null }),
      signOut: (notice = "signed_out") =>
        set({ playerId: null, sessionId: null, lastRealityCheck: null, notice }),
      markRealityCheck: (at) => set({ lastRealityCheck: at }),
      clearNotice: () => set({ notice: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        playerId: state.playerId,
        sessionId: state.sessionId,
        lastRealityCheck: state.lastRealityCheck,
        notice: state.notice,
      }),
    },
  ),
);
