"use client";

import { create } from "zustand";

/** Modali globali del pannello e menu mobile. */
export type DialogRequest = { type: "appointment"; id: string } | { type: "service"; id?: string };

interface UiState {
  dialog: DialogRequest | null;
  dialogOpen: boolean;
  dialogKey: number;
  openDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  dialog: null,
  dialogOpen: false,
  dialogKey: 0,
  openDialog: (request) =>
    set((state) => ({
      dialog: request,
      dialogOpen: true,
      dialogKey: state.dialogKey + 1,
      mobileNavOpen: false,
    })),
  closeDialog: () => set({ dialogOpen: false }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));

export const openDialog = (request: DialogRequest) => useUiStore.getState().openDialog(request);
