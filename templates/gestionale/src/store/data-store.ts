"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import { nextPaymentNumber } from "@/lib/domain/payments";
import type {
  Appointment,
  AppointmentStatus,
  BusinessSettings,
  Client,
  DataSnapshot,
  Payment,
  PaymentMethod,
  Service,
  StaffMember,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati dell'attività.
 *
 * In modalità demo i dati vivono nel browser (localStorage). Per collegare un
 * backend sostituisci le azioni con chiamate alle tue API / Server Actions
 * mantenendo le stesse firme: i componenti non devono cambiare.
 * Vedi docs/architettura.md.
 */

export const DATA_STORAGE_KEY = "nucleo:data";
const DATA_VERSION = 1;

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;
export type ServiceInput = Omit<Service, "id" | "createdAt">;
export type AppointmentInput = Omit<Appointment, "id">;
export type PaymentInput = Omit<Payment, "id" | "number">;
export type StaffInput = Omit<StaffMember, "id">;

interface PersistedData extends DataSnapshot {
  /** Data di inizializzazione: distingue "mai inizializzato" da "archivio svuotato". */
  initializedAt: string | null;
}

interface DataActions {
  /** Carica i dati salvati; se l'archivio è vuoto genera i dati demo. */
  init: () => Promise<void>;
  resetDemo: () => void;
  clearAll: () => void;

  createClient: (input: ClientInput) => Client;
  updateClient: (id: string, input: Partial<ClientInput>) => void;
  /** Elimina il cliente e i suoi appuntamenti futuri; i pagamenti restano per obblighi fiscali. */
  deleteClient: (id: string) => void;

  createService: (input: ServiceInput) => Service;
  updateService: (id: string, input: Partial<ServiceInput>) => void;
  duplicateService: (id: string, suffix: string) => Service | null;
  /** Elimina il servizio, oppure lo archivia se compare nello storico. */
  deleteService: (id: string) => "deleted" | "archived";

  createAppointment: (input: AppointmentInput) => Appointment;
  updateAppointment: (id: string, input: Partial<AppointmentInput>) => void;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;

  createPayment: (input: PaymentInput) => Payment;
  updatePayment: (id: string, input: Partial<PaymentInput>) => void;
  markPaymentPaid: (id: string, method?: PaymentMethod) => void;
  refundPayment: (id: string) => void;
  deletePayment: (id: string) => void;

  createStaff: (input: StaffInput) => StaffMember;
  updateStaff: (id: string, input: Partial<StaffInput>) => void;
  /** Rimuove l'operatore, oppure lo disattiva se ha appuntamenti registrati. */
  removeStaff: (id: string) => "removed" | "deactivated";

  updateSettings: (input: Partial<BusinessSettings>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export interface DataState extends PersistedData, DataActions {
  /** true quando i dati sono stati caricati nel browser. */
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  clients: [],
  services: [],
  staff: [],
  appointments: [],
  payments: [],
  notifications: [],
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
          if (!get().initializedAt) {
            set({ ...createDemoData(new Date()), initializedAt: nowIso() });
          }
          set({ ready: true });
        })();
        return initPromise;
      },

      resetDemo() {
        set({ ...createDemoData(new Date()), initializedAt: nowIso() });
      },

      clearAll() {
        set({
          ...emptyData,
          settings: get().settings,
          staff: get().staff,
          initializedAt: nowIso(),
        });
      },

      // --- Clienti -----------------------------------------------------------
      createClient(input) {
        const now = nowIso();
        const client: Client = { ...input, id: createId("cl"), createdAt: now, updatedAt: now };
        set((state) => ({ clients: [client, ...state.clients] }));
        return client;
      },
      updateClient(id, input) {
        set((state) => ({
          clients: replaceById(state.clients, id, { ...input, updatedAt: nowIso() }),
        }));
      },
      deleteClient(id) {
        const nowMs = Date.now();
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
          appointments: state.appointments.filter(
            (a) => a.clientId !== id || new Date(a.start).getTime() < nowMs,
          ),
        }));
      },

      // --- Servizi -----------------------------------------------------------
      createService(input) {
        const service: Service = { ...input, id: createId("sv"), createdAt: nowIso() };
        set((state) => ({ services: [...state.services, service] }));
        return service;
      },
      updateService(id, input) {
        set((state) => ({ services: replaceById(state.services, id, input) }));
      },
      duplicateService(id, suffix) {
        const source = get().services.find((service) => service.id === id);
        if (!source) return null;
        const copy: Service = {
          ...source,
          id: createId("sv"),
          name: `${source.name} ${suffix}`,
          createdAt: nowIso(),
        };
        set((state) => ({ services: [...state.services, copy] }));
        return copy;
      },
      deleteService(id) {
        const inUse = get().appointments.some((a) => a.serviceId === id);
        if (inUse) {
          set((state) => ({ services: replaceById(state.services, id, { active: false }) }));
          return "archived";
        }
        set((state) => ({ services: state.services.filter((service) => service.id !== id) }));
        return "deleted";
      },

      // --- Appuntamenti ------------------------------------------------------
      createAppointment(input) {
        const appointment: Appointment = { ...input, id: createId("ap") };
        set((state) => ({ appointments: [...state.appointments, appointment] }));
        return appointment;
      },
      updateAppointment(id, input) {
        set((state) => ({ appointments: replaceById(state.appointments, id, input) }));
      },
      setAppointmentStatus(id, status) {
        set((state) => ({ appointments: replaceById(state.appointments, id, { status }) }));
      },
      deleteAppointment(id) {
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
          payments: state.payments.map((p) =>
            p.appointmentId === id ? { ...p, appointmentId: null } : p,
          ),
        }));
      },

      // --- Pagamenti ---------------------------------------------------------
      createPayment(input) {
        const year = new Date(input.issuedAt).getFullYear();
        const payment: Payment = {
          ...input,
          id: createId("pa"),
          number: nextPaymentNumber(get().payments, year),
        };
        set((state) => ({ payments: [...state.payments, payment] }));
        return payment;
      },
      updatePayment(id, input) {
        set((state) => ({ payments: replaceById(state.payments, id, input) }));
      },
      markPaymentPaid(id, method) {
        const patch: Partial<Payment> = { status: "paid", paidAt: nowIso() };
        if (method) patch.method = method;
        set((state) => ({ payments: replaceById(state.payments, id, patch) }));
      },
      refundPayment(id) {
        set((state) => ({
          payments: replaceById(state.payments, id, { status: "refunded", paidAt: null }),
        }));
      },
      deletePayment(id) {
        set((state) => ({ payments: state.payments.filter((p) => p.id !== id) }));
      },

      // --- Team --------------------------------------------------------------
      createStaff(input) {
        const member: StaffMember = { ...input, id: createId("st") };
        set((state) => ({ staff: [...state.staff, member] }));
        return member;
      },
      updateStaff(id, input) {
        set((state) => ({ staff: replaceById(state.staff, id, input) }));
      },
      removeStaff(id) {
        const hasHistory = get().appointments.some((a) => a.staffId === id);
        if (hasHistory) {
          set((state) => ({ staff: replaceById(state.staff, id, { active: false }) }));
          return "deactivated";
        }
        set((state) => ({ staff: state.staff.filter((member) => member.id !== id) }));
        return "removed";
      },

      // --- Impostazioni e notifiche -----------------------------------------
      updateSettings(input) {
        set((state) => ({ settings: { ...state.settings, ...input } }));
      },
      markNotificationRead(id) {
        set((state) => ({
          notifications: replaceById(state.notifications, id, { read: true }),
        }));
      },
      markAllNotificationsRead() {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.read ? n : { ...n, read: true })),
        }));
      },
    }),
    {
      name: DATA_STORAGE_KEY,
      version: DATA_VERSION,
      storage: createDebouncedStorage<PersistedData>(),
      skipHydration: true,
      partialize: (state): PersistedData => ({
        initializedAt: state.initializedAt,
        clients: state.clients,
        services: state.services,
        staff: state.staff,
        appointments: state.appointments,
        payments: state.payments,
        notifications: state.notifications,
        settings: state.settings,
      }),
      // Aggiungi qui le migrazioni quando cambia la forma dei dati (DATA_VERSION).
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);

/** Esporta i dati in un oggetto serializzabile (backup, portabilità GDPR). */
export function exportSnapshot(state: DataState): PersistedData & { exportedAt: string } {
  return {
    exportedAt: nowIso(),
    initializedAt: state.initializedAt,
    clients: state.clients,
    services: state.services,
    staff: state.staff,
    appointments: state.appointments,
    payments: state.payments,
    notifications: state.notifications,
    settings: state.settings,
  };
}
