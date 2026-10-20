"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import { assignTable } from "@/lib/domain/booking";
import { nextOrderNumber } from "@/lib/domain/orders";
import type {
  DataSnapshot,
  Dish,
  Order,
  OrderStatus,
  Reservation,
  ReservationStatus,
  RestaurantSettings,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati del locale, condiviso da sito pubblico e pannello.
 * In demo vive nel browser; per la produzione sostituisci il corpo delle
 * azioni con chiamate alle API mantenendo le stesse firme (docs/architettura.md).
 */

export const DATA_STORAGE_KEY = "tavola:data";
const DATA_VERSION = 1;

export type ReservationInput = Omit<Reservation, "id" | "createdAt">;
export type OrderInput = Omit<Order, "id" | "number" | "createdAt" | "status">;
export type DishInput = Omit<Dish, "id" | "available">;

interface PersistedData extends DataSnapshot {
  initializedAt: string | null;
}

interface DataActions {
  init: () => Promise<void>;
  resetDemo: () => void;

  createReservation: (input: ReservationInput) => Reservation;
  updateReservation: (id: string, input: Partial<ReservationInput>) => void;
  setReservationStatus: (id: string, status: ReservationStatus) => void;
  /** Fa accomodare clienti senza prenotazione al tavolo indicato. */
  seatWalkIn: (tableId: string, partySize: number, name: string) => Reservation;

  placeOrder: (input: OrderInput) => Order;
  setOrderStatus: (id: string, status: OrderStatus) => void;

  createDish: (input: DishInput) => Dish;
  updateDish: (id: string, input: Partial<Dish>) => void;
  deleteDish: (id: string) => void;

  updateSettings: (input: Partial<RestaurantSettings>) => void;
}

export interface DataState extends PersistedData, DataActions {
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  categories: [],
  dishes: [],
  tables: [],
  reservations: [],
  orders: [],
  settings: DEMO_SETTINGS,
};

const nowIso = () => new Date().toISOString();
let initPromise: Promise<void> | null = null;

function replaceById<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<NoInfer<T>>,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...emptyData,
      ready: false,

      init() {
        initPromise ??= (async () => {
          await useDataStore.persist.rehydrate();
          if (!get().initializedAt) set({ ...createDemoData(new Date()), initializedAt: nowIso() });
          set({ ready: true });
          // Sincronizza le schede aperte (es. sito cliente e pannello cucina).
          window.addEventListener("storage", (event) => {
            if (event.key === DATA_STORAGE_KEY) void useDataStore.persist.rehydrate();
          });
        })();
        return initPromise;
      },

      resetDemo() {
        set({ ...createDemoData(new Date()), initializedAt: nowIso() });
      },

      createReservation(input) {
        const reservation: Reservation = { ...input, id: createId("rs"), createdAt: nowIso() };
        set((state) => ({ reservations: [...state.reservations, reservation] }));
        return reservation;
      },
      updateReservation(id, input) {
        set((state) => ({ reservations: replaceById(state.reservations, id, input) }));
      },
      setReservationStatus(id, status) {
        set((state) => ({ reservations: replaceById(state.reservations, id, { status }) }));
      },
      seatWalkIn(tableId, partySize, name) {
        const { settings, tables, reservations } = get();
        const start = new Date();
        start.setSeconds(0, 0);
        const table =
          tables.find((t) => t.id === tableId) ??
          assignTable(tables, reservations, start, settings.booking.durationMin, partySize);
        const reservation: Reservation = {
          id: createId("rs"),
          code: "WALK-IN",
          name: name || "Senza prenotazione",
          phone: "",
          email: "",
          partySize,
          start: start.toISOString(),
          durationMin: settings.booking.durationMin,
          status: "seated",
          tableId: table?.id ?? null,
          source: "walk_in",
          marketingConsent: false,
          createdAt: nowIso(),
        };
        set((state) => ({ reservations: [...state.reservations, reservation] }));
        return reservation;
      },

      placeOrder(input) {
        const order: Order = {
          ...input,
          id: createId("or"),
          number: nextOrderNumber(get().orders),
          status: "new",
          createdAt: nowIso(),
        };
        set((state) => ({ orders: [...state.orders, order] }));
        return order;
      },
      setOrderStatus(id, status) {
        set((state) => ({ orders: replaceById(state.orders, id, { status }) }));
      },

      createDish(input) {
        const dish: Dish = { ...input, id: createId("ds"), available: true };
        set((state) => ({ dishes: [...state.dishes, dish] }));
        return dish;
      },
      updateDish(id, input) {
        set((state) => ({ dishes: replaceById(state.dishes, id, input) }));
      },
      deleteDish(id) {
        set((state) => ({ dishes: state.dishes.filter((d) => d.id !== id) }));
      },

      updateSettings(input) {
        set((state) => ({ settings: { ...state.settings, ...input } }));
      },
    }),
    {
      name: DATA_STORAGE_KEY,
      version: DATA_VERSION,
      storage: createDebouncedStorage<PersistedData>(150),
      skipHydration: true,
      partialize: (state): PersistedData => ({
        initializedAt: state.initializedAt,
        categories: state.categories,
        dishes: state.dishes,
        tables: state.tables,
        reservations: state.reservations,
        orders: state.orders,
        settings: state.settings,
      }),
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);
