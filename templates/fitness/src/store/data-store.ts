"use client";

import { startOfDay } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import {
  cancellationInfo,
  checkBooking,
  nextInWaitlist,
  sessionStats,
  type BookingBlock,
} from "@/lib/domain/booking";
import { toISODate } from "@/lib/domain/dates";
import { cyclePrice, renewalPeriod } from "@/lib/domain/membership";
import { generateSessions } from "@/lib/domain/schedule";
import type {
  Booking,
  BookingStatus,
  CheckIn,
  ClubSettings,
  DataSnapshot,
  Member,
  Plan,
  TrialRequest,
  TrialStatus,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati del club, condiviso da sito, area socio e pannello.
 * In demo vive nel browser; per la produzione sostituisci il corpo delle
 * azioni con chiamate alle API mantenendo le stesse firme (docs/architettura.md).
 */

export const DATA_STORAGE_KEY = "forma:data";
const DATA_VERSION = 1;

export type MemberInput = Omit<Member, "id" | "code">;
export type PlanInput = Omit<Plan, "id" | "active">;
export type TrialInput = Omit<TrialRequest, "id" | "status" | "createdAt">;
export type BookResult = { ok: true; booking: Booking } | { ok: false; reason: BookingBlock };

interface PersistedData extends DataSnapshot {
  initializedAt: string | null;
}

interface DataActions {
  init: () => Promise<void>;
  resetDemo: () => void;

  bookSession: (memberId: string, sessionId: string) => BookResult;
  cancelBooking: (bookingId: string) => { late: boolean; promoted: Booking | null };
  setAttendance: (
    bookingId: string,
    status: Extract<BookingStatus, "attended" | "no_show" | "booked">,
  ) => void;
  promote: (bookingId: string) => void;
  cancelSession: (sessionId: string) => void;
  setSessionCapacity: (sessionId: string, capacity: number) => void;

  createTrial: (input: TrialInput) => TrialRequest;
  setTrialStatus: (id: string, status: TrialStatus) => void;

  createMember: (input: MemberInput) => Member;
  updateMember: (id: string, input: Partial<Member>) => void;
  renewMembership: (memberId: string) => void;
  checkIn: (memberId: string) => CheckIn;

  createPlan: (input: PlanInput) => Plan;
  updatePlan: (id: string, input: Partial<Plan>) => void;

  updateSettings: (input: Partial<ClubSettings>) => void;
}

export interface DataState extends PersistedData, DataActions {
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  courses: [],
  instructors: [],
  slots: [],
  sessions: [],
  plans: [],
  members: [],
  bookings: [],
  checkIns: [],
  payments: [],
  trials: [],
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

/** Codice socio progressivo leggibile ("RC-1234"). */
function nextMemberCode(members: readonly Member[]): string {
  let max = 1000;
  for (const m of members) {
    const n = Number.parseInt(m.code.replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `RC-${max + 1}`;
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
          // Il calendario resta sempre "pieno": aggiunge le lezioni dei prossimi giorni.
          const { slots, courses, sessions, settings } = get();
          const added = generateSessions(
            slots,
            courses,
            startOfDay(new Date()),
            settings.booking.windowDays + 7,
            sessions,
          );
          if (added.length > 0) set({ sessions: [...sessions, ...added] });
          set({ ready: true });
          // Sincronizza le schede aperte (es. area socio e reception).
          window.addEventListener("storage", (event) => {
            if (event.key === DATA_STORAGE_KEY) void useDataStore.persist.rehydrate();
          });
        })();
        return initPromise;
      },

      resetDemo() {
        set({ ...createDemoData(new Date()), initializedAt: nowIso() });
      },

      // --- Prenotazioni -------------------------------------------------------------

      bookSession(memberId, sessionId) {
        const state = get();
        const member = state.members.find((m) => m.id === memberId);
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!member || !session) return { ok: false, reason: "session_cancelled" };
        const check = checkBooking({
          member,
          plan: state.plans.find((p) => p.id === member.planId),
          session,
          sessions: state.sessions,
          bookings: state.bookings,
          trials: state.trials,
          settings: state.settings,
          now: new Date(),
        });
        if (!check.ok) return check;
        const booking: Booking = {
          id: createId("b"),
          sessionId,
          memberId,
          status: check.waitlist ? "waitlist" : "booked",
          createdAt: nowIso(),
        };
        set({ bookings: [...state.bookings, booking] });
        return { ok: true, booking };
      },

      cancelBooking(bookingId) {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);
        const session = booking && state.sessions.find((s) => s.id === booking.sessionId);
        if (!booking || !session) return { late: false, promoted: null };
        const { allowed, late } = cancellationInfo(booking, session, state.settings, new Date());
        if (!allowed) return { late: false, promoted: null };
        let bookings = replaceById(state.bookings, bookingId, {
          status: "cancelled",
          lateCancel: late,
        });
        let members = state.members;
        // Cancellazione tardiva di un carnet: l'ingresso viene comunque scalato.
        const member = members.find((m) => m.id === booking.memberId);
        if (late && member && member.entriesLeft !== null) {
          members = replaceById(members, member.id, {
            entriesLeft: Math.max(0, member.entriesLeft - 1),
          });
        }
        // Il posto liberato va al primo in lista d'attesa.
        let promoted: Booking | null = null;
        if (booking.status === "booked") {
          const next = nextInWaitlist(session.id, bookings);
          if (next) {
            bookings = replaceById(bookings, next.id, { status: "booked" });
            promoted = { ...next, status: "booked" };
          }
        }
        set({ bookings, members });
        return { late, promoted };
      },

      setAttendance(bookingId, status) {
        set((state) => ({ bookings: replaceById(state.bookings, bookingId, { status }) }));
      },

      promote(bookingId) {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);
        const session = booking && state.sessions.find((s) => s.id === booking.sessionId);
        if (!booking || !session || booking.status !== "waitlist") return;
        if (sessionStats(session, state.bookings, state.trials).free <= 0) return;
        set({ bookings: replaceById(state.bookings, bookingId, { status: "booked" }) });
      },

      cancelSession(sessionId) {
        set((state) => ({
          sessions: replaceById(state.sessions, sessionId, { cancelled: true }),
          bookings: state.bookings.map((b) =>
            b.sessionId === sessionId && (b.status === "booked" || b.status === "waitlist")
              ? { ...b, status: "cancelled" as const }
              : b,
          ),
        }));
      },

      setSessionCapacity(sessionId, capacity) {
        const state = get();
        const sessions = replaceById(state.sessions, sessionId, { capacity });
        const session = sessions.find((s) => s.id === sessionId);
        let bookings = state.bookings;
        // Se la capienza aumenta, i posti nuovi vanno alla lista d'attesa.
        while (session && sessionStats(session, bookings, state.trials).free > 0) {
          const next = nextInWaitlist(sessionId, bookings);
          if (!next) break;
          bookings = replaceById(bookings, next.id, { status: "booked" });
        }
        set({ sessions, bookings });
      },

      // --- Prove gratuite -----------------------------------------------------------

      createTrial(input) {
        const trial: TrialRequest = {
          ...input,
          id: createId("t"),
          status: "new",
          createdAt: nowIso(),
        };
        set((state) => ({ trials: [trial, ...state.trials] }));
        return trial;
      },
      setTrialStatus(id, status) {
        set((state) => ({ trials: replaceById(state.trials, id, { status }) }));
      },

      // --- Iscritti -------------------------------------------------------------------

      createMember(input) {
        const member: Member = { ...input, id: createId("m"), code: nextMemberCode(get().members) };
        const plan = get().plans.find((p) => p.id === member.planId);
        set((state) => ({
          members: [...state.members, member],
          payments: plan
            ? [
                {
                  id: createId("p"),
                  memberId: member.id,
                  planId: plan.id,
                  amount: cyclePrice(plan, member.cycle),
                  date: toISODate(new Date()),
                  description: plan.name,
                  status: "paid",
                  method: "card",
                },
                ...state.payments,
              ]
            : state.payments,
        }));
        return member;
      },
      updateMember(id, input) {
        set((state) => ({ members: replaceById(state.members, id, input) }));
      },
      renewMembership(memberId) {
        const state = get();
        const member = state.members.find((m) => m.id === memberId);
        const plan = member && state.plans.find((p) => p.id === member.planId);
        if (!member || !plan) return;
        const { start, end } = renewalPeriod(member, plan, startOfDay(new Date()));
        set({
          members: replaceById(state.members, memberId, {
            membershipStart: start,
            membershipEnd: end,
            entriesLeft: member.cycle === "pack" ? (plan.entries ?? 10) : null,
            suspended: false,
          }),
          payments: [
            {
              id: createId("p"),
              memberId,
              planId: plan.id,
              amount: cyclePrice(plan, member.cycle),
              date: toISODate(new Date()),
              description: `${plan.name} · rinnovo`,
              status: "paid",
              method: "card",
            },
            ...state.payments,
          ],
        });
      },
      checkIn(memberId) {
        const checkIn: CheckIn = { id: createId("c"), memberId, at: nowIso() };
        set((state) => {
          const member = state.members.find((m) => m.id === memberId);
          return {
            checkIns: [...state.checkIns, checkIn],
            members:
              member && member.entriesLeft !== null
                ? replaceById(state.members, memberId, {
                    entriesLeft: Math.max(0, member.entriesLeft - 1),
                  })
                : state.members,
          };
        });
        return checkIn;
      },

      // --- Piani e impostazioni -------------------------------------------------------

      createPlan(input) {
        const plan: Plan = { ...input, id: createId("plan"), active: true };
        set((state) => ({ plans: [...state.plans, plan] }));
        return plan;
      },
      updatePlan(id, input) {
        set((state) => ({ plans: replaceById(state.plans, id, input) }));
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
        courses: state.courses,
        instructors: state.instructors,
        slots: state.slots,
        sessions: state.sessions,
        plans: state.plans,
        members: state.members,
        bookings: state.bookings,
        checkIns: state.checkIns,
        payments: state.payments,
        trials: state.trials,
        settings: state.settings,
      }),
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);
