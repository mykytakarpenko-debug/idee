"use client";

import { create } from "zustand";

/** Carrello laterale, modali globali del pannello e menu mobile. */
export type DialogRequest =
  | { type: "order"; id: string }
  | { type: "product"; id?: string }
  | { type: "customer"; id: string };

interface UiState {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  dialog: DialogRequest | null;
  dialogOpen: boolean;
  dialogKey: number;
  openDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
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
export const openCart = () => useUiStore.getState().setCartOpen(true);
