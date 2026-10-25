"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SlipPick } from "@/lib/domain/betting";

/**
 * Schedina in costruzione. Contiene solo i riferimenti agli esiti: quote e
 * disponibilità si rileggono sempre dai dati (e in produzione dal server).
 */
interface SlipState {
  hydrated: boolean;
  picks: SlipPick[];
  stake: string;
  /** Aggiunge l'esito; se l'evento è già in schedina sostituisce l'esito; se è lo stesso lo toglie. */
  toggle: (pick: SlipPick) => void;
  remove: (selectionId: string) => void;
  clear: () => void;
  setStake: (stake: string) => void;
}

export const SLIP_STORAGE_KEY = "arena:slip";

export const useSlipStore = create<SlipState>()(
  persist(
    (set) => ({
      hydrated: false,
      picks: [],
      stake: "5",
      toggle: (pick) =>
        set((state) => {
          if (state.picks.some((p) => p.selectionId === pick.selectionId)) {
            return { picks: state.picks.filter((p) => p.selectionId !== pick.selectionId) };
          }
          return { picks: [...state.picks.filter((p) => p.eventId !== pick.eventId), pick] };
        }),
      remove: (selectionId) =>
        set((state) => ({ picks: state.picks.filter((p) => p.selectionId !== selectionId) })),
      clear: () => set({ picks: [] }),
      setStake: (stake) => set({ stake }),
    }),
    {
      name: SLIP_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ picks: state.picks, stake: state.stake }),
    },
  ),
);
