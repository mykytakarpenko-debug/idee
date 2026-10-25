import type { Cents } from "./types";

/**
 * Motore delle slot demo: 3 rulli, 1 linea di pagamento (riga centrale).
 *
 * Il ritorno teorico al giocatore (RTP) è calcolato esattamente enumerando tutte
 * le combinazioni dei rulli, quindi il valore mostrato è sempre quello reale.
 * In produzione il generatore casuale gira sul server ed è certificato da un
 * laboratorio accreditato ADM; il browser mostra solo il risultato.
 */

export type SymbolId = "ciliegia" | "limone" | "prugna" | "campana" | "stella" | "sette";

export interface SlotGame {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  volatility: "bassa" | "alta";
  /** Tre strisce di simboli (una per rullo). */
  strips: readonly [readonly SymbolId[], readonly SymbolId[], readonly SymbolId[]];
  /** Moltiplicatore della puntata per tre simboli uguali sulla linea. */
  pays: Partial<Record<SymbolId, number>>;
  /** Ciliegie a partire dal primo rullo: una o due. */
  cherry: { one: number; two: number };
  bets: readonly Cents[];
}

export const SYMBOLS: Record<SymbolId, { label: string; plural: string }> = {
  ciliegia: { label: "Ciliegia", plural: "ciliegie" },
  limone: { label: "Limone", plural: "limoni" },
  prugna: { label: "Prugna", plural: "prugne" },
  campana: { label: "Campana", plural: "campane" },
  stella: { label: "Stella", plural: "stelle" },
  sette: { label: "Sette", plural: "sette" },
};

const C = "ciliegia" as const;
const L = "limone" as const;
const P = "prugna" as const;
const B = "campana" as const;
const S = "stella" as const;
const N = "sette" as const;

export const GAMES: readonly SlotGame[] = [
  {
    slug: "frutteto",
    name: "Frutteto",
    tagline: "Classica a tre rulli, vincite piccole e frequenti",
    description:
      "Tre rulli e una linea. Le ciliegie pagano anche da sole sul primo rullo; tre simboli uguali pagano secondo la tabella.",
    volatility: "bassa",
    strips: [
      [C, L, P, L, B, C, L, P, S, L, P, C, L, B, P, N, L, P, C, B],
      [L, P, C, L, B, P, L, S, C, P, L, B, P, L, N, P, C, L, P, B],
      [P, L, B, P, L, C, P, S, L, P, B, L, P, C, L, N, P, L, B, P],
    ],
    pays: { sette: 120, stella: 50, campana: 25, prugna: 8, limone: 7, ciliegia: 10 },
    cherry: { one: 2, two: 3 },
    bets: [10, 20, 50, 100, 200],
  },
  {
    slug: "sette-doro",
    name: "Sette d'oro",
    tagline: "Volatilità alta: vincite rare ma più consistenti",
    description:
      "Tre rulli e una linea, senza premi per le ciliegie singole. Il premio massimo è 500 volte la puntata con tre sette.",
    volatility: "alta",
    strips: [
      [L, P, B, L, S, P, L, N, B, P, L, C, P, B, L, S, P, L, B, P],
      [P, L, B, P, S, L, P, B, N, L, P, C, L, B, P, S, L, P, B, L],
      [L, B, P, L, S, P, B, L, P, N, L, C, P, B, L, S, P, L, B, P],
    ],
    pays: { sette: 500, stella: 120, campana: 35, prugna: 10, limone: 8, ciliegia: 80 },
    cherry: { one: 0, two: 0 },
    bets: [10, 20, 50, 100, 200],
  },
];

export function findGame(slug: string): SlotGame | undefined {
  return GAMES.find((g) => g.slug === slug);
}

/** Moltiplicatore per una linea (simboli dei tre rulli sulla riga centrale). */
export function lineMultiplier(
  game: SlotGame,
  line: readonly [SymbolId, SymbolId, SymbolId],
): number {
  const [a, b, c] = line;
  if (a === b && b === c) return game.pays[a] ?? 0;
  if (a === "ciliegia" && b === "ciliegia") return game.cherry.two;
  if (a === "ciliegia") return game.cherry.one;
  return 0;
}

export interface SlotStats {
  /** Ritorno teorico al giocatore (0–1). */
  rtp: number;
  /** Frequenza delle combinazioni vincenti (0–1). */
  hitRate: number;
  maxMultiplier: number;
}

/** RTP e frequenza di vincita calcolati su tutte le combinazioni dei rulli. */
export function slotStats(game: SlotGame): SlotStats {
  const [r1, r2, r3] = game.strips;
  let total = 0;
  let hits = 0;
  let max = 0;
  for (const a of r1) {
    for (const b of r2) {
      for (const c of r3) {
        const m = lineMultiplier(game, [a, b, c]);
        total += m;
        if (m > 0) hits += 1;
        if (m > max) max = m;
      }
    }
  }
  const combinations = r1.length * r2.length * r3.length;
  return { rtp: total / combinations, hitRate: hits / combinations, maxMultiplier: max };
}

export type Stops = readonly [number, number, number];

/** Finestra visibile: 3 righe per rullo (sopra, linea, sotto). */
export function visibleGrid(game: SlotGame, stops: Stops): SymbolId[][] {
  return game.strips.map((strip, reel) => {
    const n = strip.length;
    const s = stops[reel]!;
    return [strip[(s - 1 + n) % n]!, strip[s % n]!, strip[(s + 1) % n]!];
  });
}

export interface SpinOutcome {
  stops: Stops;
  grid: SymbolId[][];
  line: [SymbolId, SymbolId, SymbolId];
  multiplier: number;
  win: Cents;
}

export function spinOutcome(game: SlotGame, stops: Stops, bet: Cents): SpinOutcome {
  const grid = visibleGrid(game, stops);
  const line: [SymbolId, SymbolId, SymbolId] = [grid[0]![1]!, grid[1]![1]!, grid[2]![1]!];
  const multiplier = lineMultiplier(game, line);
  return { stops, grid, line, multiplier, win: bet * multiplier };
}

/** Intero uniforme in [0, n) dal generatore crittografico (senza distorsione). */
export function secureInt(n: number, source: () => number = cryptoUint32): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  for (;;) {
    const value = source();
    if (value < limit) return value % n;
  }
}

function cryptoUint32(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0]!;
}

export function randomStops(game: SlotGame, source?: () => number): Stops {
  return [
    secureInt(game.strips[0].length, source),
    secureInt(game.strips[1].length, source),
    secureInt(game.strips[2].length, source),
  ];
}

/** Durata minima di una giocata: niente giocate rapide né automatiche. */
export const MIN_SPIN_MS = 2_500;
