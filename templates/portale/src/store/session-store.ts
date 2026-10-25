"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NO_ATTEMPTS, registerFailure, type AttemptState } from "@/lib/domain/auth";

/**
 * Sessione (solo demo). In produzione l'identità arriva da un provider di
 * autenticazione con cookie HttpOnly e la verifica in due passaggi avviene sul
 * server: non salvare mai token o codici nel localStorage.
 */
export type SessionNotice = "signed_out" | "expired" | null;

interface SessionState {
  hydrated: boolean;
  /** Utente con accesso completato (password + secondo fattore). */
  userId: string | null;
  /** Utente che ha superato la password e deve inserire il codice. */
  pendingUserId: string | null;
  attempts: AttemptState;
  lastActivity: number;
  notice: SessionNotice;
  startLogin: (userId: string) => void;
  completeLogin: (now: number) => void;
  failOtp: (now: number) => void;
  cancelLogin: () => void;
  signOut: (notice?: SessionNotice) => void;
  touch: (now: number) => void;
  clearNotice: () => void;
}

export const SESSION_STORAGE_KEY = "portale:session";

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      userId: null,
      pendingUserId: null,
      attempts: NO_ATTEMPTS,
      lastActivity: 0,
      notice: null,
      startLogin: (userId) => set({ pendingUserId: userId, notice: null }),
      completeLogin: (now) =>
        set((state) => ({
          userId: state.pendingUserId,
          pendingUserId: null,
          attempts: NO_ATTEMPTS,
          lastActivity: now,
        })),
      failOtp: (now) => set((state) => ({ attempts: registerFailure(state.attempts, now) })),
      cancelLogin: () => set({ pendingUserId: null }),
      signOut: (notice = "signed_out") => set({ userId: null, pendingUserId: null, notice }),
      touch: (now) => set({ lastActivity: now }),
      clearNotice: () => set({ notice: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        userId: state.userId,
        pendingUserId: state.pendingUserId,
        attempts: state.attempts,
        lastActivity: state.lastActivity,
        notice: state.notice,
      }),
    },
  ),
);
