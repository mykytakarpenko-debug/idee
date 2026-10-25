import { addDays } from "date-fns";
import { toISODate } from "./dates";
import { playBlock } from "./responsible";
import type { Cents, DataSnapshot, ISODate, Transaction } from "./types";

/** Indicatori per l'operatore. Funzioni pure, testate. */

export interface DayActivity {
  day: ISODate;
  staked: Cents;
  returned: Cents;
  /** Raccolta meno vincite (Gross Gaming Revenue). */
  ggr: Cents;
}

export function dailyActivity(
  transactions: readonly Transaction[],
  now: Date,
  days: number,
): DayActivity[] {
  const rows: DayActivity[] = Array.from({ length: days }, (_, i) => ({
    day: toISODate(addDays(now, i - days + 1)),
    staked: 0,
    returned: 0,
    ggr: 0,
  }));
  const index = new Map(rows.map((r, i) => [r.day, i]));
  for (const t of transactions) {
    const i = index.get(toISODate(new Date(t.at)));
    if (i === undefined) continue;
    const row = rows[i]!;
    if (t.kind === "bet" || t.kind === "spin") row.staked -= t.amount;
    if (t.kind === "bet_win" || t.kind === "spin_win" || t.kind === "bet_refund")
      row.returned += t.amount;
  }
  for (const row of rows) row.ggr = row.staked - row.returned;
  return rows;
}

export interface OperatorKpis {
  activePlayers: number;
  staked: Cents;
  ggr: Cents;
  openBets: number;
  /** Vincite potenziali delle scommesse aperte. */
  exposure: Cents;
  pendingKyc: number;
  blocked: number;
}

export function operatorKpis(data: DataSnapshot, now: Date, days = 30): OperatorKpis {
  const activity = dailyActivity(data.transactions, now, days);
  const from = addDays(now, -7).getTime();
  const active = new Set(
    data.transactions
      .filter((t) => (t.kind === "bet" || t.kind === "spin") && new Date(t.at).getTime() > from)
      .map((t) => t.playerId),
  );
  const open = data.bets.filter((b) => b.status === "open");
  return {
    activePlayers: active.size,
    staked: activity.reduce((acc, d) => acc + d.staked, 0),
    ggr: activity.reduce((acc, d) => acc + d.ggr, 0),
    openBets: open.length,
    exposure: open.reduce((acc, b) => acc + b.potentialWin, 0),
    pendingKyc: data.players.filter((p) => p.kyc === "pending").length,
    blocked: data.players.filter(
      (p) =>
        playBlock(p, now)?.reason === "self_exclusion" || playBlock(p, now)?.reason === "pause",
    ).length,
  };
}
