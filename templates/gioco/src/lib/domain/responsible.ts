import type {
  Cents,
  GameSession,
  Limits,
  PendingLimits,
  Player,
  RgEvent,
  Transaction,
  TransactionKind,
} from "./types";

/**
 * Regole del gioco responsabile. Funzioni pure, testate; in produzione vanno
 * applicate dal server a ogni ricarica, giocata e accesso.
 *
 * - Limiti di ricarica su 24 ore, 7 giorni e 30 giorni (finestre mobili).
 * - Limite di perdita netta nelle 24 ore.
 * - Riduzioni subito, aumenti dopo un periodo di attesa.
 * - Pausa e autoesclusione bloccano gioco e ricariche fino alla scadenza.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const WINDOWS = { day: DAY, week: 7 * DAY, month: 30 * DAY } as const;
export type LimitWindow = keyof typeof WINDOWS;

const STAKES: TransactionKind[] = ["bet", "spin"];
const RETURNS: TransactionKind[] = ["bet_win", "bet_refund", "spin_win"];

function since(
  transactions: readonly Transaction[],
  playerId: string,
  from: number,
  kinds: TransactionKind[],
) {
  return transactions.filter(
    (t) => t.playerId === playerId && kinds.includes(t.kind) && new Date(t.at).getTime() > from,
  );
}

const total = (items: readonly Transaction[]) => items.reduce((acc, t) => acc + t.amount, 0);

/** Ricariche nella finestra mobile indicata. */
export function depositsIn(
  transactions: readonly Transaction[],
  playerId: string,
  window: LimitWindow,
  now: Date,
): Cents {
  return total(since(transactions, playerId, now.getTime() - WINDOWS[window], ["deposit"]));
}

/** Perdita netta (puntate − vincite e rimborsi) da un istante. */
export function netLossSince(
  transactions: readonly Transaction[],
  playerId: string,
  from: number,
): Cents {
  const staked = -total(since(transactions, playerId, from, STAKES));
  const returned = total(since(transactions, playerId, from, RETURNS));
  return staked - returned;
}

/** Limiti in vigore: un aumento in attesa diventa effettivo alla sua data. */
export function effectiveLimits(
  player: Pick<Player, "limits" | "pendingLimits">,
  now: Date,
): Limits {
  if (player.pendingLimits && new Date(player.pendingLimits.effectiveAt) <= now) {
    return player.pendingLimits.limits;
  }
  return player.limits;
}

export type DepositCheck =
  | { ok: true }
  | { ok: false; reason: "limit"; window: LimitWindow; remaining: Cents }
  | { ok: false; reason: "blocked" };

/** Importo massimo ricaricabile adesso (il minimo tra i limiti residui). */
export function depositRemaining(
  player: Player,
  transactions: readonly Transaction[],
  now: Date,
): { window: LimitWindow; remaining: Cents } | null {
  const limits = effectiveLimits(player, now);
  const candidates: { window: LimitWindow; limit: Cents | null }[] = [
    { window: "day", limit: limits.depositDay },
    { window: "week", limit: limits.depositWeek },
    { window: "month", limit: limits.depositMonth },
  ];
  let best: { window: LimitWindow; remaining: Cents } | null = null;
  for (const { window, limit } of candidates) {
    if (limit === null) continue;
    const remaining = Math.max(0, limit - depositsIn(transactions, player.id, window, now));
    if (!best || remaining < best.remaining) best = { window, remaining };
  }
  return best;
}

export function checkDeposit(
  amount: Cents,
  player: Player,
  transactions: readonly Transaction[],
  now: Date,
): DepositCheck {
  if (playBlock(player, now)) return { ok: false, reason: "blocked" };
  const room = depositRemaining(player, transactions, now);
  if (room && amount > room.remaining) return { ok: false, reason: "limit", ...room };
  return { ok: true };
}

export type StakeCheck =
  | { ok: true }
  | { ok: false; reason: "loss_limit"; remaining: Cents }
  | { ok: false; reason: "balance" }
  | { ok: false; reason: "blocked" };

/** Una puntata è ammessa se non supera saldo e perdita massima residua delle 24 ore. */
export function checkStake(
  stake: Cents,
  player: Player,
  transactions: readonly Transaction[],
  now: Date,
): StakeCheck {
  if (playBlock(player, now)) return { ok: false, reason: "blocked" };
  if (stake > player.balance) return { ok: false, reason: "balance" };
  const limit = effectiveLimits(player, now).lossDay;
  if (limit !== null) {
    const remaining = Math.max(
      0,
      limit - netLossSince(transactions, player.id, now.getTime() - DAY),
    );
    if (stake > remaining) return { ok: false, reason: "loss_limit", remaining };
  }
  return { ok: true };
}

const LIMIT_KEYS = [
  "depositDay",
  "depositWeek",
  "depositMonth",
  "lossDay",
  "sessionMinutes",
] as const;

/** Un valore è "più restrittivo" se è un limite più basso o se prima non c'era limite. */
function stricter(next: number | null, current: number | null): boolean {
  if (next === null) return false;
  return current === null || next <= current;
}

/**
 * Applica una modifica ai limiti: le parti più restrittive valgono subito, quelle
 * meno restrittive (aumenti o rimozioni) dopo `waitDays` giorni.
 */
export function changeLimits(
  current: Limits,
  next: Limits,
  now: Date,
  waitDays: number,
): { limits: Limits; pending: PendingLimits | null } {
  const immediate = { ...current };
  let relaxed = false;
  for (const key of LIMIT_KEYS) {
    const value = next[key];
    if (stricter(value, current[key])) {
      (immediate as Record<string, number | null>)[key] = value;
    } else if (value !== current[key]) {
      relaxed = true;
    }
  }
  return {
    limits: immediate,
    pending: relaxed
      ? { limits: next, effectiveAt: new Date(now.getTime() + waitDays * DAY).toISOString() }
      : null,
  };
}

export type PlayBlock =
  | { reason: "self_exclusion"; until: string | null }
  | { reason: "pause"; until: string }
  | { reason: "cooldown"; until: string };

/** Motivo per cui il giocatore non può giocare né ricaricare in questo momento. */
export function playBlock(
  player: Pick<Player, "selfExclusion" | "pausedUntil" | "cooldownUntil">,
  now: Date,
): PlayBlock | null {
  const t = now.getTime();
  const ex = player.selfExclusion;
  if (ex && (ex.until === null || new Date(ex.until).getTime() > t)) {
    return { reason: "self_exclusion", until: ex.until };
  }
  if (player.pausedUntil && new Date(player.pausedUntil).getTime() > t) {
    return { reason: "pause", until: player.pausedUntil };
  }
  if (player.cooldownUntil && new Date(player.cooldownUntil).getTime() > t) {
    return { reason: "cooldown", until: player.cooldownUntil };
  }
  return null;
}

/** Durate disponibili per la pausa (giorni) e l'autoesclusione (giorni, null = indeterminata). */
export const PAUSE_DAYS = [1, 7, 30] as const;
export const SELF_EXCLUSION_DAYS = [30, 60, 90, null] as const;
/** L'autoesclusione a tempo indeterminato si può revocare solo dopo 6 mesi. */
export const INDEFINITE_MIN_MONTHS = 6;

export function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY).toISOString();
}

/** Pausa dopo aver raggiunto il limite di durata della sessione. */
export const SESSION_COOLDOWN_MINUTES = 30;

export function sessionMinutes(session: Pick<GameSession, "startedAt">, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / MINUTE));
}

export function sessionExpired(
  session: Pick<GameSession, "startedAt">,
  limitMinutes: number | null,
  now: Date,
): boolean {
  return limitMinutes !== null && sessionMinutes(session, now) >= limitMinutes;
}

/** Il promemoria scatta a ogni intervallo dall'inizio della sessione. */
export function realityCheckDue(
  session: Pick<GameSession, "startedAt">,
  lastShownAt: number | null,
  intervalMinutes: number,
  now: Date,
): boolean {
  const start = new Date(session.startedAt).getTime();
  const reference = Math.max(start, lastShownAt ?? 0);
  return now.getTime() - reference >= intervalMinutes * MINUTE;
}

/** Puntate, vincite e saldo netto di una sessione. */
export function sessionSummary(
  transactions: readonly Transaction[],
  playerId: string,
  from: string,
) {
  const start = new Date(from).getTime() - 1;
  const staked = -total(since(transactions, playerId, start, STAKES));
  const returned = total(since(transactions, playerId, start, RETURNS));
  return { staked, returned, net: returned - staked };
}

/** Test "Lie/Bet" (due domande): un "sì" suggerisce di chiedere un parere. */
export function selfTestResult(answers: readonly boolean[]): "ok" | "attention" {
  return answers.some(Boolean) ? "attention" : "ok";
}

export type RiskSignal =
  "limit_hits" | "night_play" | "long_sessions" | "deposit_growth" | "limit_increase";

/**
 * Segnali per l'operatore (ultimi 7 giorni). Non sono diagnosi: indicano
 * quando contattare il giocatore secondo la procedura interna.
 */
export function riskSignals(input: {
  player: Player;
  transactions: readonly Transaction[];
  sessions: readonly GameSession[];
  rgEvents: readonly RgEvent[];
  now: Date;
}): RiskSignal[] {
  const { player, transactions, sessions, rgEvents, now } = input;
  const weekAgo = now.getTime() - 7 * DAY;
  const signals: RiskSignal[] = [];
  const recent = <T extends { playerId: string }>(items: readonly T[], at: (item: T) => string) =>
    items.filter((i) => i.playerId === player.id && new Date(at(i)).getTime() > weekAgo);

  if (recent(rgEvents, (e) => e.at).filter((e) => e.kind === "limit_hit").length >= 3) {
    signals.push("limit_hits");
  }
  const own = recent(sessions, (s) => s.startedAt);
  // Ora locale italiana: tra mezzanotte e le 6.
  const night = own.filter((s) => {
    const hour = Number(
      new Intl.DateTimeFormat("it-IT", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: "Europe/Rome",
      }).format(new Date(s.startedAt)),
    );
    return hour < 6;
  });
  if (night.length >= 3) signals.push("night_play");
  const long = own.filter((s) => {
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now.getTime();
    return end - new Date(s.startedAt).getTime() >= 3 * HOUR;
  });
  if (long.length >= 2) signals.push("long_sessions");
  const last = depositsIn(transactions, player.id, "week", now);
  const previous = total(
    transactions.filter(
      (t) =>
        t.playerId === player.id &&
        t.kind === "deposit" &&
        new Date(t.at).getTime() > weekAgo - 7 * DAY &&
        new Date(t.at).getTime() <= weekAgo,
    ),
  );
  if (last >= 5_000 && last > previous * 2) signals.push("deposit_growth");
  if (player.pendingLimits) signals.push("limit_increase");
  return signals;
}
