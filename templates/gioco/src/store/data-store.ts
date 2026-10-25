"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import {
  betCode,
  checkSlip,
  resolvePick,
  settleBet,
  type SlipIssue,
  type SlipPick,
} from "@/lib/domain/betting";
import {
  addDays,
  changeLimits,
  checkDeposit,
  checkStake,
  effectiveLimits,
  playBlock,
  SESSION_COOLDOWN_MINUTES,
  type LimitWindow,
} from "@/lib/domain/responsible";
import { findGame, spinOutcome, type SpinOutcome, type Stops } from "@/lib/domain/slots";
import type {
  Bet,
  DataSnapshot,
  KycStatus,
  Limits,
  Player,
  RgEventKind,
  Score,
  Transaction,
  TransactionKind,
} from "@/lib/domain/types";
import { createId } from "@/lib/utils";
import { createDebouncedStorage } from "./persist-storage";

/**
 * Store dei dati di Arena, condiviso da sito, conto e pannello operatore.
 * In demo vive nel browser; in produzione ogni azione diventa una chiamata al
 * server, che applica le stesse regole (saldo, limiti, blocchi) in una transazione.
 */

export const DATA_STORAGE_KEY = "arena:data";
const DATA_VERSION = 1;

interface PersistedData extends DataSnapshot {
  initializedAt: string | null;
}

export type BetResult =
  | { ok: true; bet: Bet }
  | { ok: false; issues: (SlipIssue | "loss_limit" | "blocked")[]; remaining?: number };

export type SpinResult =
  | { ok: true; outcome: SpinOutcome }
  | { ok: false; reason: "balance" | "loss_limit" | "blocked" | "invalid"; remaining?: number };

export type DepositResult =
  | { ok: true }
  | { ok: false; reason: "limit"; window: LimitWindow; remaining: number }
  | { ok: false; reason: "blocked" };

export type WithdrawResult = { ok: true } | { ok: false; reason: "kyc" | "balance" };

export interface RegisterInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  fiscalCode: string;
  city: string;
  email: string;
  documentType: Player["document"]["type"];
  documentNumber: string;
  documentExpiresOn: string;
  depositWeek: number;
}

interface DataActions {
  init: () => Promise<void>;
  resetDemo: () => void;

  register: (input: RegisterInput) => Player | null;
  startSession: (playerId: string) => string | null;
  endSession: (sessionId: string | null, reason?: "session_limit") => void;

  deposit: (playerId: string, amount: number) => DepositResult;
  withdraw: (playerId: string, amount: number) => WithdrawResult;
  placeBet: (playerId: string, picks: SlipPick[], stake: number) => BetResult;
  spin: (playerId: string, slug: string, bet: number, stops: Stops) => SpinResult;

  setLimits: (
    playerId: string,
    limits: Limits,
    realityCheckMinutes: number,
  ) => { pendingFrom: string | null };
  pause: (playerId: string, days: number) => void;
  selfExclude: (playerId: string, days: number | null) => void;
  logRg: (playerId: string, kind: RgEventKind, detail: string) => void;

  settleEvent: (eventId: string, score: Score | null) => number;
  setKyc: (playerId: string, status: KycStatus) => void;
  setOperatorNote: (playerId: string, note: string) => void;
}

export interface DataState extends PersistedData, DataActions {
  ready: boolean;
}

const emptyData: PersistedData = {
  initializedAt: null,
  settings: DEMO_SETTINGS,
  events: [],
  players: [],
  bets: [],
  transactions: [],
  spins: [],
  sessions: [],
  rgEvents: [],
};

let initPromise: Promise<void> | null = null;

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => {
      const player = (id: string) => get().players.find((p) => p.id === id);

      /** Movimento sul conto: aggiorna saldo e registro in un'unica operazione. */
      const move = (
        players: Player[],
        transactions: Transaction[],
        playerId: string,
        kind: TransactionKind,
        amount: number,
        ref: string,
        at = new Date().toISOString(),
      ) => {
        const index = players.findIndex((p) => p.id === playerId);
        if (index < 0) return;
        const balance = players[index]!.balance + amount;
        players[index] = { ...players[index]!, balance };
        transactions.push({
          id: createId("tx"),
          playerId,
          at,
          kind,
          amount,
          balanceAfter: balance,
          ref,
        });
      };

      const rgEvent = (playerId: string, kind: RgEventKind, detail: string) => ({
        id: createId("rg"),
        playerId,
        at: new Date().toISOString(),
        kind,
        detail,
      });

      /** Limiti in vigore salvati sul giocatore quando l'attesa è finita. */
      const withEffectiveLimits = (p: Player, now: Date): Player =>
        p.pendingLimits && new Date(p.pendingLimits.effectiveAt) <= now
          ? { ...p, limits: effectiveLimits(p, now), pendingLimits: null }
          : p;

      return {
        ...emptyData,
        ready: false,

        init() {
          initPromise ??= (async () => {
            await useDataStore.persist.rehydrate();
            if (!get().initializedAt)
              set({ ...createDemoData(new Date()), initializedAt: new Date().toISOString() });
            const now = new Date();
            set((state) => ({
              ready: true,
              players: state.players.map((p) => withEffectiveLimits(p, now)),
            }));
            window.addEventListener("storage", (event) => {
              if (event.key === DATA_STORAGE_KEY) void useDataStore.persist.rehydrate();
            });
          })();
          return initPromise;
        },

        resetDemo() {
          set({ ...createDemoData(new Date()), initializedAt: new Date().toISOString() });
        },

        register(input) {
          const state = get();
          const email = input.email.toLowerCase();
          if (
            state.players.some(
              (p) => p.email.toLowerCase() === email || p.fiscalCode === input.fiscalCode,
            )
          ) {
            return null;
          }
          const now = new Date().toISOString();
          const created: Player = {
            id: createId("p"),
            firstName: input.firstName,
            lastName: input.lastName,
            email,
            birthDate: input.birthDate,
            fiscalCode: input.fiscalCode,
            city: input.city,
            document: {
              type: input.documentType,
              number: input.documentNumber.toUpperCase(),
              expiresOn: input.documentExpiresOn,
            },
            kyc: "pending",
            createdAt: now,
            lastLoginAt: null,
            balance: 0,
            limits: {
              depositDay: null,
              depositWeek: input.depositWeek,
              depositMonth: null,
              lossDay: null,
              sessionMinutes: null,
            },
            pendingLimits: null,
            realityCheckMinutes: 30,
            pausedUntil: null,
            selfExclusion: null,
            cooldownUntil: null,
            operatorNote: "",
          };
          set({
            players: [...state.players, created],
            rgEvents: [
              ...state.rgEvents,
              rgEvent(created.id, "limit_set", "Limiti iniziali alla registrazione"),
            ],
          });
          return created;
        },

        startSession(playerId) {
          const p = player(playerId);
          if (!p) return null;
          const now = new Date();
          const session = {
            id: createId("s"),
            playerId,
            startedAt: now.toISOString(),
            endedAt: null,
          };
          set((state) => ({
            sessions: [...state.sessions, session],
            players: state.players.map((x) =>
              x.id === playerId
                ? withEffectiveLimits({ ...x, lastLoginAt: session.startedAt }, now)
                : x,
            ),
          }));
          return session.id;
        },

        endSession(sessionId, reason) {
          const session = get().sessions.find((s) => s.id === sessionId);
          if (!session || session.endedAt) return;
          const now = new Date();
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, endedAt: now.toISOString() } : s,
            ),
            players:
              reason === "session_limit"
                ? state.players.map((p) =>
                    p.id === session.playerId
                      ? {
                          ...p,
                          cooldownUntil: new Date(
                            now.getTime() + SESSION_COOLDOWN_MINUTES * 60_000,
                          ).toISOString(),
                        }
                      : p,
                  )
                : state.players,
            rgEvents:
              reason === "session_limit"
                ? [
                    ...state.rgEvents,
                    rgEvent(
                      session.playerId,
                      "session_limit",
                      "Sessione chiusa al limite di durata",
                    ),
                  ]
                : state.rgEvents,
          }));
        },

        deposit(playerId, amount) {
          const p = player(playerId);
          if (!p) return { ok: false, reason: "blocked" };
          const now = new Date();
          const check = checkDeposit(amount, p, get().transactions, now);
          if (!check.ok) {
            if (check.reason === "limit") {
              set((state) => ({
                rgEvents: [
                  ...state.rgEvents,
                  rgEvent(playerId, "limit_hit", "Limite di ricarica raggiunto"),
                ],
              }));
              return {
                ok: false,
                reason: "limit",
                window: check.window,
                remaining: check.remaining,
              };
            }
            return { ok: false, reason: "blocked" };
          }
          const players = [...get().players];
          const transactions = [...get().transactions];
          move(players, transactions, playerId, "deposit", amount, "Ricarica demo");
          set({ players, transactions });
          return { ok: true };
        },

        withdraw(playerId, amount) {
          const p = player(playerId);
          if (!p || p.kyc !== "verified") return { ok: false, reason: "kyc" };
          if (amount > p.balance) return { ok: false, reason: "balance" };
          const players = [...get().players];
          const transactions = [...get().transactions];
          move(players, transactions, playerId, "withdrawal", -amount, "Prelievo demo");
          set({ players, transactions });
          return { ok: true };
        },

        placeBet(playerId, picks, stake) {
          const state = get();
          const p = player(playerId);
          if (!p) return { ok: false, issues: ["blocked"] };
          const now = new Date();
          // Quote e disponibilità sono ricontrollate qui, mai prese dal browser.
          const check = checkSlip({
            picks,
            events: state.events,
            stake,
            balance: p.balance,
            settings: state.settings,
            now,
          });
          if (check.issues.length > 0) return { ok: false, issues: check.issues };
          const stakeCheck = checkStake(stake, p, state.transactions, now);
          if (!stakeCheck.ok) {
            if (stakeCheck.reason === "loss_limit") {
              set({
                rgEvents: [
                  ...state.rgEvents,
                  rgEvent(playerId, "limit_hit", "Limite di perdita giornaliero"),
                ],
              });
              return { ok: false, issues: ["loss_limit"], remaining: stakeCheck.remaining };
            }
            return { ok: false, issues: [stakeCheck.reason === "balance" ? "balance" : "blocked"] };
          }
          const lines = picks.map((pick) => {
            const r = resolvePick(state.events, pick)!;
            return {
              ...pick,
              odds: r.selection.odds,
              event: `${r.event.home} – ${r.event.away}`,
              market: r.market.kind,
              selection: r.selection.label,
              outcome: "pending" as const,
            };
          });
          const bet: Bet = {
            id: createId("b"),
            code: betCode(state.bets.length + 1),
            playerId,
            placedAt: now.toISOString(),
            stake,
            lines,
            odds: check.odds,
            potentialWin: check.potentialWin,
            status: "open",
            settledAt: null,
            payout: 0,
          };
          const players = [...state.players];
          const transactions = [...state.transactions];
          move(players, transactions, playerId, "bet", -stake, bet.code, bet.placedAt);
          set({ players, transactions, bets: [...state.bets, bet] });
          return { ok: true, bet };
        },

        spin(playerId, slug, bet, stops) {
          const state = get();
          const p = player(playerId);
          const game = findGame(slug);
          if (!p || !game || !game.bets.includes(bet)) return { ok: false, reason: "invalid" };
          const now = new Date();
          const check = checkStake(bet, p, state.transactions, now);
          if (!check.ok) {
            if (check.reason === "loss_limit") {
              set({
                rgEvents: [
                  ...state.rgEvents,
                  rgEvent(playerId, "limit_hit", "Limite di perdita giornaliero"),
                ],
              });
              return { ok: false, reason: "loss_limit", remaining: check.remaining };
            }
            return { ok: false, reason: check.reason };
          }
          const outcome = spinOutcome(game, stops, bet);
          const players = [...state.players];
          const transactions = [...state.transactions];
          const at = now.toISOString();
          move(players, transactions, playerId, "spin", -bet, game.name, at);
          if (outcome.win > 0)
            move(players, transactions, playerId, "spin_win", outcome.win, game.name, at);
          set({
            players,
            transactions,
            spins: [
              ...state.spins,
              { id: createId("sp"), playerId, game: slug, at, bet, win: outcome.win },
            ],
          });
          return { ok: true, outcome };
        },

        setLimits(playerId, limits, realityCheckMinutes) {
          const p = player(playerId);
          if (!p) return { pendingFrom: null };
          const now = new Date();
          const current = effectiveLimits(p, now);
          const { limits: applied, pending } = changeLimits(
            current,
            limits,
            now,
            get().settings.limitIncreaseDays,
          );
          set((state) => ({
            players: state.players.map((x) =>
              x.id === playerId
                ? { ...x, limits: applied, pendingLimits: pending, realityCheckMinutes }
                : x,
            ),
            rgEvents: [
              ...state.rgEvents,
              rgEvent(
                playerId,
                "limit_set",
                pending ? "Riduzioni subito, aumenti in attesa" : "Limiti ridotti",
              ),
            ],
          }));
          return { pendingFrom: pending?.effectiveAt ?? null };
        },

        pause(playerId, days) {
          const now = new Date();
          set((state) => ({
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, pausedUntil: addDays(now, days) } : p,
            ),
            rgEvents: [...state.rgEvents, rgEvent(playerId, "pause", `Pausa di ${days} giorni`)],
          }));
        },

        selfExclude(playerId, days) {
          const now = new Date();
          set((state) => ({
            players: state.players.map((p) =>
              p.id === playerId
                ? {
                    ...p,
                    selfExclusion: {
                      from: now.toISOString(),
                      until: days === null ? null : addDays(now, days),
                    },
                  }
                : p,
            ),
            rgEvents: [
              ...state.rgEvents,
              rgEvent(
                playerId,
                "self_exclusion",
                days === null
                  ? "Autoesclusione a tempo indeterminato"
                  : `Autoesclusione di ${days} giorni`,
              ),
            ],
          }));
        },

        logRg(playerId, kind, detail) {
          set((state) => ({ rgEvents: [...state.rgEvents, rgEvent(playerId, kind, detail)] }));
        },

        settleEvent(eventId, score) {
          const state = get();
          const events = state.events.map((e) =>
            e.id === eventId
              ? { ...e, status: score ? ("finished" as const) : ("cancelled" as const), score }
              : e,
          );
          const players = [...state.players];
          const transactions = [...state.transactions];
          const at = new Date().toISOString();
          let settled = 0;
          const bets = state.bets.map((bet) => {
            if (bet.status !== "open" || !bet.lines.some((l) => l.eventId === eventId)) return bet;
            const result = settleBet(bet, events, state.settings.maxWin);
            if (result.status === "open") return { ...bet, lines: result.lines };
            settled += 1;
            if (result.payout > 0) {
              move(
                players,
                transactions,
                bet.playerId,
                result.status === "void" ? "bet_refund" : "bet_win",
                result.payout,
                bet.code,
                at,
              );
            }
            return {
              ...bet,
              status: result.status,
              lines: result.lines,
              payout: result.payout,
              settledAt: at,
            };
          });
          set({ events, bets, players, transactions });
          return settled;
        },

        setKyc(playerId, status) {
          set((state) => ({
            players: state.players.map((p) => (p.id === playerId ? { ...p, kyc: status } : p)),
          }));
        },

        setOperatorNote(playerId, note) {
          set((state) => ({
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, operatorNote: note.slice(0, 1000) } : p,
            ),
          }));
        },
      };
    },
    {
      name: DATA_STORAGE_KEY,
      version: DATA_VERSION,
      storage: createDebouncedStorage<PersistedData>(150),
      skipHydration: true,
      partialize: (state): PersistedData => ({
        initializedAt: state.initializedAt,
        settings: state.settings,
        events: state.events,
        players: state.players,
        bets: state.bets,
        transactions: state.transactions,
        spins: state.spins,
        sessions: state.sessions,
        rgEvents: state.rgEvents,
      }),
      migrate: (persisted) => persisted as PersistedData,
    },
  ),
);

/** Il giocatore può giocare adesso? (usato per disabilitare i comandi) */
export function canPlay(p: Player | undefined, now: Date): boolean {
  return Boolean(p) && playBlock(p!, now) === null;
}
