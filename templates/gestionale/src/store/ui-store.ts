"use client";

import { create } from "zustand";

/**
 * Stato dell'interfaccia non persistito: modali globali, ricerca rapida, menu mobile.
 * Le modali sono globali così si possono aprire da qualsiasi punto
 * (calendario, scheda cliente, ricerca rapida) senza duplicare i moduli.
 */
export type DialogRequest =
  | { type: "client"; id?: string }
  | { type: "service"; id?: string }
  | {
      type: "appointment";
      id?: string;
      defaults?: { clientId?: string; serviceId?: string; staffId?: string; start?: string };
    }
  | { type: "appointment-details"; id: string }
  | { type: "payment"; id?: string; defaults?: { clientId?: string; appointmentId?: string } }
  | { type: "staff"; id?: string };

interface UiState {
  /** Ultima modale richiesta (resta montata durante l'animazione di chiusura). */
  dialog: DialogRequest | null;
  dialogOpen: boolean;
  /** Cambia a ogni apertura: usato come `key` per rimontare i moduli con valori freschi. */
  dialogKey: number;
  openDialog: (request: DialogRequest) => void;
  closeDialog: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

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
      commandOpen: false,
      mobileNavOpen: false,
    })),
  closeDialog: () => set({ dialogOpen: false }),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));

export const openDialog = (request: DialogRequest) => useUiStore.getState().openDialog(request);
