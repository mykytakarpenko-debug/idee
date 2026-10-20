"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import {
  ANY_STAFF,
  availableSlots,
  bookingCode,
  initialStatus,
  manageability,
  pickStaff,
} from "@/lib/domain/availability";
import { toISODate } from "@/lib/domain/dates";
import type {
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  BusinessSettings,
  Customer,
  DataSnapshot,
  Mode,
  Service,
  TimeOff,
  WeeklyHours,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati dello studio, condiviso da pagina pubblica, widget e pannello.
 * In demo vive nel browser; in produzione sostituisci il corpo delle azioni con
 * chiamate alle API mantenendo le stesse firme (docs/architettura.md).
 */

export const DATA_STORAGE_KEY = "agenda:data";
const DATA_VERSION = 1;

export interface BookingInput {
  serviceId: string;
  /** ID del professionista o "any" per il primo disponibile. */
  staffId: string;
  mode: Mode;
  start: string;
  customer: Customer;
  notes?: string;
  marketingConsent: boolean;
  source: AppointmentSource;
}

export type BookingResult =
  { ok: true; appointment: Appointment } | { ok: false; reason: "slot_taken" };
export type ServiceInput = Omit<Service, "id" | "active">;

interface PersistedData extends DataSnapshot {
  initializedAt: string | null;
}

interface DataActions {
  init: () => Promise<void>;
  resetDemo: () => void;

  book: (input: BookingInput) => BookingResult;
  reschedule: (id: string, start: string) => boolean;
  cancel: (id: string, by: "customer" | "business") => void;
  confirm: (id: string) => void;
  setStatus: (id: string, status: AppointmentStatus) => void;

  createService: (input: ServiceInput) => Service;
  updateService: (id: string, input: Partial<Service>) => void;

  setHours: (staffId: string, hours: WeeklyHours[]) => void;
  addTimeOff: (input: Omit<TimeOff, "id">) => void;
  removeTimeOff: (id: string) => void;

  updateSettings: (input: Partial<BusinessSettings>) => void;
}

export interface DataState extends PersistedData, DataActions {
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  categories: [],
  services: [],
  staff: [],
  hours: [],
  timeOff: [],
  appointments: [],
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
          // Sincronizza le schede aperte (es. widget del cliente e agenda dello studio).
          window.addEventListener("storage", (event) => {
            if (event.key === DATA_STORAGE_KEY) void useDataStore.persist.rehydrate();
          });
        })();
        return initPromise;
      },

      resetDemo() {
        set({ ...createDemoData(new Date()), initializedAt: nowIso() });
      },

      book(input) {
        const state = get();
        const service = state.services.find((s) => s.id === input.serviceId);
        if (!service) return { ok: false, reason: "slot_taken" };
        const start = new Date(input.start);
        const date = toISODate(start);
        // Ricontrolla la disponibilità al momento della conferma (in produzione: lato server).
        const slot = availableSlots({
          service,
          staffId: input.staffId,
          date,
          data: state,
          booking: state.settings.booking,
          now: new Date(),
        }).find((s) => s.start.getTime() === start.getTime());
        if (!slot) return { ok: false, reason: "slot_taken" };
        const staffId =
          input.staffId === ANY_STAFF
            ? pickStaff(slot.staffIds, state.appointments, date)
            : input.staffId;
        const at = nowIso();
        const appointment: Appointment = {
          id: createId("ap"),
          code: bookingCode(Math.random),
          serviceId: service.id,
          staffId,
          mode: input.mode,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          status: initialStatus(service),
          customer: input.customer,
          notes: input.notes || undefined,
          marketingConsent: input.marketingConsent,
          source: input.source,
          createdAt: at,
          history: [{ at, action: "created", by: "customer" }],
        };
        set({ appointments: [...state.appointments, appointment] });
        return { ok: true, appointment };
      },

      reschedule(id, start) {
        const state = get();
        const appointment = state.appointments.find((a) => a.id === id);
        const service = appointment && state.services.find((s) => s.id === appointment.serviceId);
        if (!appointment || !service) return false;
        if (!manageability(appointment, state.settings.booking, new Date()).allowed) return false;
        const startDate = new Date(start);
        const slot = availableSlots({
          service,
          staffId: appointment.staffId,
          date: toISODate(startDate),
          data: state,
          booking: state.settings.booking,
          now: new Date(),
          ignoreAppointmentId: id,
        }).find((s) => s.start.getTime() === startDate.getTime());
        if (!slot) return false;
        set({
          appointments: replaceById(state.appointments, id, {
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            history: [
              ...appointment.history,
              { at: nowIso(), action: "rescheduled", by: "customer" },
            ],
          }),
        });
        return true;
      },

      cancel(id, by) {
        set((state) => {
          const appointment = state.appointments.find((a) => a.id === id);
          if (!appointment) return {};
          return {
            appointments: replaceById(state.appointments, id, {
              status: "cancelled",
              history: [...appointment.history, { at: nowIso(), action: "cancelled", by }],
            }),
          };
        });
      },

      confirm(id) {
        set((state) => {
          const appointment = state.appointments.find((a) => a.id === id);
          if (!appointment) return {};
          return {
            appointments: replaceById(state.appointments, id, {
              status: "confirmed",
              history: [
                ...appointment.history,
                { at: nowIso(), action: "confirmed", by: "business" },
              ],
            }),
          };
        });
      },

      setStatus(id, status) {
        set((state) => ({ appointments: replaceById(state.appointments, id, { status }) }));
      },

      createService(input) {
        const service: Service = { ...input, id: createId("sv"), active: true };
        set((state) => ({ services: [...state.services, service] }));
        return service;
      },
      updateService(id, input) {
        set((state) => ({ services: replaceById(state.services, id, input) }));
      },

      setHours(staffId, hours) {
        set((state) => ({
          hours: [...state.hours.filter((h) => h.staffId !== staffId), ...hours],
        }));
      },
      addTimeOff(input) {
        set((state) => ({ timeOff: [...state.timeOff, { ...input, id: createId("off") }] }));
      },
      removeTimeOff(id) {
        set((state) => ({ timeOff: state.timeOff.filter((t) => t.id !== id) }));
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
        services: state.services,
        staff: state.staff,
        hours: state.hours,
        timeOff: state.timeOff,
        appointments: state.appointments,
        settings: state.settings,
      }),
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);
