"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Preferenze dell'utente su questo dispositivo (piccole, salvate subito). */
export type CalendarView = "day" | "week" | "month";

interface PrefsState {
  /** true dopo il caricamento delle preferenze salvate (non persistito). */
  hydrated: boolean;
  demoBannerDismissed: boolean;
  calendarView: CalendarView | null;
  hiddenStaffIds: string[];
  setDemoBannerDismissed: (value: boolean) => void;
  setCalendarView: (view: CalendarView) => void;
  toggleStaffVisibility: (id: string) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      hydrated: false,
      demoBannerDismissed: false,
      calendarView: null,
      hiddenStaffIds: [],
      setDemoBannerDismissed: (value) => set({ demoBannerDismissed: value }),
      setCalendarView: (view) => set({ calendarView: view }),
      toggleStaffVisibility: (id) =>
        set((state) => ({
          hiddenStaffIds: state.hiddenStaffIds.includes(id)
            ? state.hiddenStaffIds.filter((x) => x !== id)
            : [...state.hiddenStaffIds, id],
        })),
    }),
    {
      name: "nucleo:prefs",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ demoBannerDismissed, calendarView, hiddenStaffIds }) => ({
        demoBannerDismissed,
        calendarView,
        hiddenStaffIds,
      }),
    },
  ),
);
