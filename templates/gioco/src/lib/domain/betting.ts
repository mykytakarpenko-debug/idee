import type {
  Bet,
  BetLine,
  BetStatus,
  Cents,
  LineOutcome,
  Market,
  Odds,
  OperatorSettings,
  Selection,
  SportEvent,
} from "./types";

/** Scommesse a quota fissa: quote, schedina, validazione, liquidazione. Funzioni pure, testate. */

export interface SlipPick {
  eventId: string;
  marketId: string;
  selectionId: string;
}

export interface ResolvedPick {
  event: SportEvent;
  market: Market;
  selection: Selection;
}

export function resolvePick(events: readonly SportEvent[], pick: SlipPick): ResolvedPick | null {
  const event = events.find((e) => e.id === pick.eventId);
  const market = event?.markets.find((m) => m.id === pick.marketId);
  const selection = market?.selections.find((s) => s.id === pick.selectionId);
  return event && market && selection ? { event, market, selection } : null;
}

/** Quota totale di una multipla: prodotto delle quote, troncato al centesimo. */
export function combinedOdds(odds: readonly Odds[]): Odds {
  if (odds.length === 0) return 0;
  // Si lavora in interi (decimillesimi) per evitare errori di arrotondamento.
  let value = 10_000;
  for (const o of odds) value = Math.floor((value * o) / 100);
  return Math.floor(value / 100);
}

/** Vincita potenziale, limitata alla vincita massima per schedina. */
export function potentialWin(stake: Cents, odds: Odds, maxWin: Cents): Cents {
  return Math.min(Math.floor((stake * odds) / 100), maxWin);
}

/** Quote dalle probabilità stimate, con il margine dell'operatore. */
export function oddsFromProbabilities(probabilities: readonly number[], margin: number): Odds[] {
  return probabilities.map((p) => Math.max(101, Math.floor(100 / (p * (1 + margin)))));
}

/** Margine implicito di un mercato (somma delle probabilità implicite − 1). */
export function bookMargin(selections: readonly Pick<Selection, "odds">[]): number {
  return selections.reduce((acc, s) => acc + 100 / s.odds, 0) - 1;
}

export type SlipIssue =
  "empty" | "too_many" | "same_event" | "unavailable" | "stake_min" | "stake_max" | "balance";

export interface SlipCheck {
  issues: SlipIssue[];
  odds: Odds;
  potentialWin: Cents;
  /** La vincita è stata ridotta al massimo consentito. */
  capped: boolean;
}

/** Controlla una schedina: singola con un esito, multipla con più eventi diversi. */
export function checkSlip(input: {
  picks: readonly SlipPick[];
  events: readonly SportEvent[];
  stake: Cents;
  balance: Cents;
  settings: Pick<OperatorSettings, "minStake" | "maxStake" | "maxWin" | "maxLines">;
  now: Date;
}): SlipCheck {
  const { picks, events, stake, balance, settings, now } = input;
  const issues: SlipIssue[] = [];
  if (picks.length === 0) issues.push("empty");
  if (picks.length > settings.maxLines) issues.push("too_many");
  const eventIds = picks.map((p) => p.eventId);
  if (new Set(eventIds).size !== eventIds.length) issues.push("same_event");
  const resolved = picks.map((p) => resolvePick(events, p));
  if (
    resolved.some((r) => !r || r.event.status !== "scheduled" || new Date(r.event.startsAt) <= now)
  ) {
    issues.push("unavailable");
  }
  if (stake < settings.minStake) issues.push("stake_min");
  if (stake > settings.maxStake) issues.push("stake_max");
  if (stake > balance) issues.push("balance");
  const odds = combinedOdds(resolved.flatMap((r) => (r ? [r.selection.odds] : [])));
  const raw = Math.floor((stake * odds) / 100);
  return {
    issues,
    odds,
    potentialWin: Math.min(raw, settings.maxWin),
    capped: raw > settings.maxWin,
  };
}

/** Esito di una selezione a evento concluso (null se non ancora determinabile). */
export function selectionOutcome(
  event: SportEvent,
  market: Market,
  selection: Selection,
): LineOutcome {
  if (event.status === "cancelled") return "void";
  if (event.status !== "finished" || !event.score) return "pending";
  const { home, away } = event.score;
  let winning: string;
  switch (market.kind) {
    case "1X2":
      winning = home > away ? "1" : home === away ? "X" : "2";
      break;
    case "12":
      winning = home > away ? "1" : "2";
      break;
    case "OU25":
      winning = home + away > 2.5 ? "Over" : "Under";
      break;
    case "GGNG":
      winning = home > 0 && away > 0 ? "Goal" : "No goal";
      break;
  }
  return selection.label === winning ? "won" : "lost";
}

/**
 * Liquida una scommessa in base agli eventi:
 * - persa se almeno un esito è perso;
 * - aperta finché un esito è in attesa;
 * - gli esiti annullati valgono quota 1; tutto annullato → rimborso della puntata.
 */
export function settleBet(
  bet: Bet,
  events: readonly SportEvent[],
  maxWin: Cents,
): { status: BetStatus; lines: BetLine[]; payout: Cents } {
  const lines = bet.lines.map((line) => {
    const resolved = resolvePick(events, line);
    return {
      ...line,
      outcome: resolved
        ? selectionOutcome(resolved.event, resolved.market, resolved.selection)
        : line.outcome,
    };
  });
  if (lines.some((l) => l.outcome === "lost")) return { status: "lost", lines, payout: 0 };
  if (lines.some((l) => l.outcome === "pending")) return { status: "open", lines, payout: 0 };
  const won = lines.filter((l) => l.outcome === "won");
  if (won.length === 0) return { status: "void", lines, payout: bet.stake };
  return {
    status: "won",
    lines,
    payout: potentialWin(bet.stake, combinedOdds(won.map((l) => l.odds)), maxWin),
  };
}

export function betCode(sequence: number): string {
  return `ARN-${String(sequence).padStart(6, "0")}`;
}

/** Quota in formato italiano: 185 → "1,85". */
export function formatOdds(odds: Odds): string {
  return (odds / 100).toFixed(2).replace(".", ",");
}
