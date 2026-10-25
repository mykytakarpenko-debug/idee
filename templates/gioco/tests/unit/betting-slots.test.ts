import { describe, expect, it } from "vitest";
import {
  betCode,
  bookMargin,
  checkSlip,
  combinedOdds,
  formatOdds,
  oddsFromProbabilities,
  potentialWin,
  selectionOutcome,
  settleBet,
} from "@/lib/domain/betting";
import {
  GAMES,
  lineMultiplier,
  randomStops,
  secureInt,
  slotStats,
  spinOutcome,
  visibleGrid,
} from "@/lib/domain/slots";
import type { Bet, SportEvent } from "@/lib/domain/types";

const NOW = new Date("2026-10-21T10:00:00+02:00");
const SETTINGS = { minStake: 100, maxStake: 50_000, maxWin: 1_000_000, maxLines: 20 };

const event = (id: string, patch: Partial<SportEvent> = {}): SportEvent => ({
  id,
  sport: "calcio",
  competition: "Lega",
  home: `Casa ${id}`,
  away: `Ospite ${id}`,
  startsAt: "2026-10-21T18:00:00+02:00",
  status: "scheduled",
  score: null,
  markets: [
    {
      id: `${id}_1x2`,
      kind: "1X2",
      selections: [
        { id: `${id}_1`, label: "1", odds: 200 },
        { id: `${id}_x`, label: "X", odds: 320 },
        { id: `${id}_2`, label: "2", odds: 380 },
      ],
    },
    {
      id: `${id}_ou`,
      kind: "OU25",
      selections: [
        { id: `${id}_o`, label: "Over", odds: 185 },
        { id: `${id}_u`, label: "Under", odds: 195 },
      ],
    },
    {
      id: `${id}_gg`,
      kind: "GGNG",
      selections: [
        { id: `${id}_g`, label: "Goal", odds: 175 },
        { id: `${id}_n`, label: "No goal", odds: 200 },
      ],
    },
  ],
  ...patch,
});

const pick = (e: string, m: string, s: string) => ({
  eventId: e,
  marketId: `${e}_${m}`,
  selectionId: `${e}_${s}`,
});

describe("quote", () => {
  it("moltiplica le quote senza errori di arrotondamento", () => {
    expect(combinedOdds([200, 185])).toBe(370);
    expect(combinedOdds([185, 185, 185])).toBe(633);
    expect(combinedOdds([])).toBe(0);
  });

  it("limita la vincita potenziale al massimo", () => {
    expect(potentialWin(500, 370, 1_000_000)).toBe(1_850);
    expect(potentialWin(50_000, 100_000, 1_000_000)).toBe(1_000_000);
  });

  it("ricava le quote dalle probabilità con il margine", () => {
    const odds = oddsFromProbabilities([0.5, 0.3, 0.2], 0.06);
    expect(odds).toEqual([188, 314, 471]);
    expect(bookMargin(odds.map((o) => ({ odds: o })))).toBeGreaterThan(0.05);
  });

  it("formatta le quote all'italiana", () => {
    expect(formatOdds(185)).toBe("1,85");
    expect(betCode(12)).toBe("ARN-000012");
  });
});

describe("schedina", () => {
  const events = [event("a"), event("b"), event("c", { startsAt: "2026-10-21T09:00:00+02:00" })];

  it("calcola quota e vincita di una multipla valida", () => {
    const check = checkSlip({
      picks: [pick("a", "1x2", "1"), pick("b", "ou", "o")],
      events,
      stake: 500,
      balance: 10_000,
      settings: SETTINGS,
      now: NOW,
    });
    expect(check.issues).toEqual([]);
    expect(check.odds).toBe(370);
    expect(check.potentialWin).toBe(1_850);
  });

  it("rifiuta esiti dello stesso evento, eventi iniziati, importi fuori limite e saldo insufficiente", () => {
    const same = checkSlip({
      picks: [pick("a", "1x2", "1"), pick("a", "ou", "o")],
      events,
      stake: 500,
      balance: 10_000,
      settings: SETTINGS,
      now: NOW,
    });
    expect(same.issues).toContain("same_event");
    const started = checkSlip({
      picks: [pick("c", "1x2", "1")],
      events,
      stake: 500,
      balance: 10_000,
      settings: SETTINGS,
      now: NOW,
    });
    expect(started.issues).toContain("unavailable");
    const low = checkSlip({
      picks: [pick("a", "1x2", "1")],
      events,
      stake: 50,
      balance: 10_000,
      settings: SETTINGS,
      now: NOW,
    });
    expect(low.issues).toEqual(["stake_min"]);
    const poor = checkSlip({
      picks: [pick("a", "1x2", "1")],
      events,
      stake: 5_000,
      balance: 1_000,
      settings: SETTINGS,
      now: NOW,
    });
    expect(poor.issues).toEqual(["balance"]);
    expect(
      checkSlip({ picks: [], events, stake: 500, balance: 1, settings: SETTINGS, now: NOW }).issues,
    ).toContain("empty");
  });
});

describe("liquidazione", () => {
  const finished = (id: string, home: number, away: number) =>
    event(id, { status: "finished", score: { home, away } });

  it("determina l'esito di ogni mercato", () => {
    const e = finished("a", 2, 1);
    expect(selectionOutcome(e, e.markets[0]!, e.markets[0]!.selections[0]!)).toBe("won");
    expect(selectionOutcome(e, e.markets[1]!, e.markets[1]!.selections[0]!)).toBe("won");
    expect(selectionOutcome(e, e.markets[2]!, e.markets[2]!.selections[1]!)).toBe("lost");
    const draw = finished("b", 0, 0);
    expect(selectionOutcome(draw, draw.markets[0]!, draw.markets[0]!.selections[1]!)).toBe("won");
    expect(
      selectionOutcome(event("c"), event("c").markets[0]!, event("c").markets[0]!.selections[0]!),
    ).toBe("pending");
  });

  const bet = (lines: ReturnType<typeof pick>[], odds: number[]): Bet => ({
    id: "b",
    code: "ARN-000001",
    playerId: "p",
    placedAt: NOW.toISOString(),
    stake: 1_000,
    lines: lines.map((l, i) => ({
      ...l,
      odds: odds[i]!,
      event: "",
      market: "1X2",
      selection: "",
      outcome: "pending",
    })),
    odds: combinedOdds(odds),
    potentialWin: 0,
    status: "open",
    settledAt: null,
    payout: 0,
  });

  it("paga le vincenti, chiude le perdenti, aspetta gli eventi aperti", () => {
    const events = [finished("a", 2, 0), finished("b", 1, 1), event("c")];
    expect(settleBet(bet([pick("a", "1x2", "1")], [200]), events, 1_000_000)).toMatchObject({
      status: "won",
      payout: 2_000,
    });
    expect(
      settleBet(bet([pick("a", "1x2", "1"), pick("b", "1x2", "1")], [200, 300]), events, 1_000_000)
        .status,
    ).toBe("lost");
    expect(
      settleBet(bet([pick("a", "1x2", "1"), pick("c", "1x2", "1")], [200, 300]), events, 1_000_000)
        .status,
    ).toBe("open");
  });

  it("vale quota 1 per gli eventi annullati e rimborsa se sono tutti annullati", () => {
    const events = [finished("a", 2, 0), event("b", { status: "cancelled" })];
    expect(
      settleBet(bet([pick("a", "1x2", "1"), pick("b", "1x2", "1")], [200, 300]), events, 1_000_000),
    ).toMatchObject({ status: "won", payout: 2_000 });
    expect(settleBet(bet([pick("b", "1x2", "1")], [300]), events, 1_000_000)).toMatchObject({
      status: "void",
      payout: 1_000,
    });
  });
});

describe("slot", () => {
  it("mostra un RTP calcolato tra il 90% (minimo di legge) e il 97%", () => {
    for (const game of GAMES) {
      const { rtp, hitRate } = slotStats(game);
      expect(rtp).toBeGreaterThanOrEqual(0.9);
      expect(rtp).toBeLessThan(0.97);
      expect(hitRate).toBeGreaterThan(0);
    }
    expect(slotStats(GAMES[0]!).rtp).toBeCloseTo(0.955625, 6);
  });

  it("paga tre uguali e le ciliegie dal primo rullo", () => {
    const game = GAMES[0]!;
    expect(lineMultiplier(game, ["sette", "sette", "sette"])).toBe(120);
    expect(lineMultiplier(game, ["ciliegia", "ciliegia", "limone"])).toBe(3);
    expect(lineMultiplier(game, ["ciliegia", "limone", "limone"])).toBe(2);
    expect(lineMultiplier(game, ["limone", "ciliegia", "ciliegia"])).toBe(0);
  });

  it("legge la riga centrale e calcola la vincita", () => {
    const game = GAMES[0]!;
    const grid = visibleGrid(game, [0, 0, 0]);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toEqual([game.strips[0].at(-1), game.strips[0][0], game.strips[0][1]]);
    const outcome = spinOutcome(game, [0, 0, 0], 50);
    expect(outcome.win).toBe(50 * outcome.multiplier);
  });

  it("estrae interi uniformi senza distorsione", () => {
    const values = [4_294_967_295, 7];
    expect(secureInt(10, () => values.shift()!)).toBe(7);
    const stops = randomStops(GAMES[1]!);
    stops.forEach((s, i) => expect(s).toBeLessThan(GAMES[1]!.strips[i]!.length));
  });
});
