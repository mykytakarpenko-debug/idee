"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine } from "@/lib/domain/orders";
import type { OrderType } from "@/lib/domain/types";

/** Carrello degli ordini online, salvato nel browser del cliente. */
interface CartState {
  hydrated: boolean;
  lines: CartLine[];
  type: OrderType;
  add: (dishId: string) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  setType: (type: OrderType) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      hydrated: false,
      lines: [],
      type: "delivery",
      add: (dishId) =>
        set((state) => {
          const existing = state.lines.find((line) => line.dishId === dishId);
          return {
            lines: existing
              ? state.lines.map((line) =>
                  line.dishId === dishId
                    ? { ...line, quantity: Math.min(20, line.quantity + 1) }
                    : line,
                )
              : [...state.lines, { dishId, quantity: 1 }],
          };
        }),
      setQuantity: (dishId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((line) => line.dishId !== dishId)
              : state.lines.map((line) =>
                  line.dishId === dishId ? { ...line, quantity: Math.min(20, quantity) } : line,
                ),
        })),
      setType: (type) => set({ type }),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "tavola:cart",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, type }) => ({ lines, type }),
    },
  ),
);
