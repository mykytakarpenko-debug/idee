"use client";

import { create } from "zustand";

/** Schedina su mobile e menu del pannello. */
interface UiState {
  slipOpen: boolean;
  setSlipOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  slipOpen: false,
  setSlipOpen: (open) => set({ slipOpen: open }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
