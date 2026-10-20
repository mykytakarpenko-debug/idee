"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addLine, normalizeCode, type CartLine } from "@/lib/domain/cart";

/**
 * Carrello del visitatore: solo riferimenti (prodotto, variante, quantità) e
 * codice sconto. Prezzi e disponibilità si leggono sempre dal catalogo.
 */
export const CART_STORAGE_KEY = "bottega:cart";

interface CartState {
  hydrated: boolean;
  lines: CartLine[];
  couponCode: string | null;
  /** Aggiunge rispettando la disponibilità; restituisce quanti pezzi sono stati aggiunti. */
  add: (line: CartLine, stock: number) => number;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
}

const same = (line: CartLine, productId: string, variantId: string) =>
  line.productId === productId && line.variantId === variantId;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      lines: [],
      couponCode: null,
      add(line, stock) {
        const result = addLine(get().lines, line, stock);
        if (result.added > 0) set({ lines: result.lines });
        return result.added;
      },
      setQuantity(productId, variantId, quantity) {
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => !same(l, productId, variantId))
              : state.lines.map((l) => (same(l, productId, variantId) ? { ...l, quantity } : l)),
        }));
      },
      remove(productId, variantId) {
        set((state) => ({ lines: state.lines.filter((l) => !same(l, productId, variantId)) }));
      },
      clear() {
        set({ lines: [], couponCode: null });
      },
      setCoupon(code) {
        set({ couponCode: code ? normalizeCode(code) : null });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines, couponCode: state.couponCode }),
    },
  ),
);
