import { addDays, addMinutes, setHours, setMinutes, startOfDay } from "date-fns";
import {
  betCode,
  combinedOdds,
  oddsFromProbabilities,
  potentialWin,
  settleBet,
} from "@/lib/domain/betting";
import { fiscalCodeCheckChar } from "@/lib/domain/kyc";
import type {
  Bet,
  BetLine,
  DataSnapshot,
  GameSession,
  Market,
  OperatorSettings,
  Player,
  RgEvent,
  SpinRecord,
  Sport,
  SportEvent,
  Transaction,
  TransactionKind,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";

/**
 * Dati demo di "Arena", operatore inventato. Deterministici (stesso seme, stessa
 * data → stessi dati), con date relative a oggi. Squadre, giocatori, persone e
 * codici fiscali sono inventati: i codici fiscali usano il codice comune "Z000",
 * che non esiste, quindi non possono coincidere con quelli di persone reali.
 * I crediti non hanno valore: nessun pagamento reale.
 */

const SEED = 20_260_707;

export const DEMO_PLAYER_ID = "p_demo";
export const DEMO_EMAIL = "davide.conti@example.com";

export const DEMO_SETTINGS: OperatorSettings = {
  name: "Arena",
  company: "Arena Gioco S.r.l. (dati di esempio)",
  vatNumber: "IT00000000000",
  address: "Via dell'Esempio 1, 00100 Roma",
  email: "assistenza@arena.example",
  license: "Concessione ADM n. 00000 (segnaposto)",
  minStake: 100,
  maxStake: 50_000,
  maxWin: 1_000_000,
  maxLines: 20,
  limitIncreaseDays: 7,
};

const MARGIN = 0.06;

const FOOTBALL = [
  "Atletico Brenta",
  "Real Mincio",
  "Sporting Adige",
  "Union Garda",
  "Calcio Valtellina",
  "Olimpia Tevere",
  "Pro Arno",
  "Dinamo Sesia",
  "Virtus Piave",
  "Aurora Ticino",
];
const TENNIS = [
  "L. Ferrandi",
  "M. Castori",
  "A. Brunetti",
  "S. Lindqvist",
  "J. Moreau",
  "D. Kovač",
  "T. Albers",
  "R. Okafor",
];
const BASKET = [
  "Pallacanestro Lario",
  "Basket Etna",
  "Aquile Sannio",
  "Libertas Po",
  "Stella Brianza",
  "Delfini Ionio",
];

const COMPETITIONS: Record<Sport, string> = {
  calcio: "Lega Nazionale",
  tennis: "Torneo di Ponente",
  basket: "Serie Nazionale Basket",
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function pair(random: Random, names: readonly string[]): [string, string] {
  const home = random.pick(names);
  let away = random.pick(names);
  while (away === home) away = random.pick(names);
  return [home, away];
}

function markets(
  id: string,
  sport: Sport,
  p1: number,
  pDraw: number,
  pOver: number,
  pGoal: number,
): Market[] {
  if (sport !== "calcio") {
    const [o1, o2] = oddsFromProbabilities([p1, 1 - p1], MARGIN);
    return [
      {
        id: `${id}_12`,
        kind: "12",
        selections: [
          { id: `${id}_12_1`, label: "1", odds: o1! },
          { id: `${id}_12_2`, label: "2", odds: o2! },
        ],
      },
    ];
  }
  const [a, x, b] = oddsFromProbabilities([p1, pDraw, 1 - p1 - pDraw], MARGIN);
  const [over, under] = oddsFromProbabilities([pOver, 1 - pOver], MARGIN);
  const [gg, ng] = oddsFromProbabilities([pGoal, 1 - pGoal], MARGIN);
  return [
    {
      id: `${id}_1x2`,
      kind: "1X2",
      selections: [
        { id: `${id}_1x2_1`, label: "1", odds: a! },
        { id: `${id}_1x2_x`, label: "X", odds: x! },
        { id: `${id}_1x2_2`, label: "2", odds: b! },
      ],
    },
    {
      id: `${id}_ou`,
      kind: "OU25",
      selections: [
        { id: `${id}_ou_o`, label: "Over", odds: over! },
        { id: `${id}_ou_u`, label: "Under", odds: under! },
      ],
    },
    {
      id: `${id}_gg`,
      kind: "GGNG",
      selections: [
        { id: `${id}_gg_g`, label: "Goal", odds: gg! },
        { id: `${id}_gg_n`, label: "No goal", odds: ng! },
      ],
    },
  ];
}

function makeEvent(
  random: Random,
  index: number,
  sport: Sport,
  startsAt: Date,
  finished: boolean,
): SportEvent {
  const id = `e_${index}`;
  const names = sport === "calcio" ? FOOTBALL : sport === "tennis" ? TENNIS : BASKET;
  const [home, away] = pair(random, names);
  const diff = random.next() - 0.5;
  const p1 =
    sport === "calcio" ? clamp(0.42 + diff * 0.6, 0.15, 0.72) : clamp(0.55 + diff * 0.7, 0.2, 0.85);
  const pDraw = sport === "calcio" ? clamp(0.28 - Math.abs(diff) * 0.15, 0.18, 0.3) : 0;
  const pOver = clamp(0.5 + (random.next() - 0.5) * 0.3, 0.3, 0.7);
  const pGoal = clamp(0.5 + (random.next() - 0.5) * 0.3, 0.3, 0.7);
  let score: SportEvent["score"] = null;
  if (finished) {
    if (sport === "calcio") {
      const r = random.next();
      const winner = r < p1 ? "home" : r < p1 + pDraw ? "draw" : "away";
      const low = random.int(0, 2);
      const high = low + random.int(1, 2);
      score =
        winner === "draw"
          ? { home: low, away: low }
          : winner === "home"
            ? { home: high, away: low }
            : { home: low, away: high };
    } else if (sport === "tennis") {
      const homeWins = random.chance(p1);
      const loser = random.int(0, 1);
      score = homeWins ? { home: 2, away: loser } : { home: loser, away: 2 };
    } else {
      const winner = random.int(70, 98);
      const loser = winner - random.int(2, 18);
      score = random.chance(p1) ? { home: winner, away: loser } : { home: loser, away: winner };
    }
  }
  return {
    id,
    sport,
    competition: COMPETITIONS[sport],
    home,
    away,
    startsAt: startsAt.toISOString(),
    status: finished ? "finished" : "scheduled",
    score,
    markets: markets(id, sport, p1, pDraw, pOver, pGoal),
  };
}

function shuffle<T>(random: Random, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = random.int(0, i);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

const at = (day: Date, hour: number, minute = 0) => setMinutes(setHours(day, hour), minute);

function makeEvents(random: Random, now: Date): SportEvent[] {
  const events: SportEvent[] = [];
  const today = startOfDay(now);
  let index = 1;
  for (let d = -14; d <= 7; d += 1) {
    const day = addDays(today, d);
    const slots: [Sport, number, number][] = [
      ["calcio", 15, 0],
      ["calcio", 18, 0],
      ["calcio", 20, 45],
      ["tennis", 13, 30],
      ["basket", 20, 30],
    ];
    if (day.getDay() === 0 || day.getDay() === 6) slots.push(["calcio", 12, 30], ["tennis", 16, 0]);
    for (const [sport, hour, minute] of slots) {
      const startsAt = at(day, hour, minute);
      // Finiti gli eventi iniziati da più di 3 ore.
      const finished = startsAt.getTime() < now.getTime() - 3 * 3_600_000;
      if (!finished && startsAt.getTime() <= now.getTime()) continue;
      events.push(makeEvent(random, index, sport, startsAt, finished));
      index += 1;
    }
  }
  // Una partita iniziata da poco: chiusa alle giocate, da refertare nel pannello.
  events.push(makeEvent(random, index, "calcio", addMinutes(now, -100), false));
  return events;
}

const FIRST = [
  "Andrea",
  "Beatrice",
  "Carlo",
  "Chiara",
  "Elena",
  "Fabio",
  "Federica",
  "Giorgio",
  "Irene",
  "Lorenzo",
  "Marta",
  "Matteo",
  "Nicola",
  "Paola",
  "Roberto",
  "Sara",
  "Simone",
  "Valeria",
];
const LAST = [
  "Bassi",
  "Bianchi",
  "Colombo",
  "Costa",
  "Fontana",
  "Greco",
  "Leone",
  "Lombardi",
  "Marino",
  "Moretti",
  "Rizzi",
  "Santoro",
  "Testa",
  "Villa",
];
const CITIES = [
  "Milano",
  "Roma",
  "Torino",
  "Napoli",
  "Bologna",
  "Firenze",
  "Bari",
  "Verona",
  "Padova",
  "Genova",
];
const MONTHS = "ABCDEHLMPRST";

const consonants = (s: string) =>
  s
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/[AEIOU]/g, "");
const vowels = (s: string) => s.toUpperCase().replace(/[^AEIOU]/g, "");

/** Codice fiscale con comune "Z000" (inesistente): solo per dati demo. */
export function demoFiscalCode(
  first: string,
  last: string,
  birth: string,
  female: boolean,
): string {
  const take3 = (s: string) => (consonants(s) + vowels(s) + "XXX").slice(0, 3);
  const c = consonants(first);
  const name = c.length >= 4 ? c[0]! + c[2]! + c[3]! : take3(first);
  const [y, m, d] = birth.split("-").map(Number) as [number, number, number];
  const first15 = `${take3(last)}${name}${String(y % 100).padStart(2, "0")}${MONTHS[m - 1]}${String(female ? d + 40 : d).padStart(2, "0")}Z000`;
  return first15 + fiscalCodeCheckChar(first15);
}

const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

interface Ledger {
  transactions: Transaction[];
  add: (player: Player, when: Date, kind: TransactionKind, amount: number, ref: string) => void;
}

function ledger(): Ledger {
  const transactions: Transaction[] = [];
  let n = 0;
  return {
    transactions,
    add(player, when, kind, amount, ref) {
      player.balance += amount;
      n += 1;
      transactions.push({
        id: `tx_${n}`,
        playerId: player.id,
        at: when.toISOString(),
        kind,
        amount,
        balanceAfter: player.balance,
        ref,
      });
    },
  };
}

function basePlayer(
  random: Random,
  id: string,
  now: Date,
  overrides: Partial<Player> = {},
): Player {
  const female = random.chance(0.45);
  const firstName = random.pick(FIRST);
  const lastName = random.pick(LAST);
  const year = random.int(1962, 2004);
  const birthDate = `${year}-${String(random.int(1, 12)).padStart(2, "0")}-${String(random.int(1, 28)).padStart(2, "0")}`;
  return {
    id,
    firstName,
    lastName,
    email: `${plain(firstName)}.${plain(lastName)}${random.int(1, 99)}@example.com`,
    birthDate,
    fiscalCode: demoFiscalCode(firstName, lastName, birthDate, female),
    city: random.pick(CITIES),
    document: {
      type: random.pick(["carta_identita", "patente", "passaporto"] as const),
      number: `CA${random.int(10000, 99999)}XX`,
      expiresOn: `${now.getFullYear() + random.int(1, 8)}-0${random.int(1, 9)}-15`,
    },
    kyc: "verified",
    createdAt: addDays(now, -random.int(40, 700)).toISOString(),
    lastLoginAt: null,
    balance: 0,
    limits: {
      depositDay: null,
      depositWeek: random.pick([5_000, 10_000, 20_000, 50_000]),
      depositMonth: null,
      lossDay: random.chance(0.4) ? random.pick([2_000, 5_000, 10_000]) : null,
      sessionMinutes: random.chance(0.3) ? random.pick([60, 120]) : null,
    },
    pendingLimits: null,
    realityCheckMinutes: random.pick([15, 30, 60]),
    pausedUntil: null,
    selfExclusion: null,
    cooldownUntil: null,
    operatorNote: "",
    ...overrides,
  };
}

export function createDemoData(now: Date): DataSnapshot {
  const random = createRandom(SEED);
  const settings = structuredClone(DEMO_SETTINGS);
  const events = makeEvents(random, now);
  const finished = events.filter((e) => e.status === "finished");
  const upcoming = events.filter((e) => e.status === "scheduled");
  const book = ledger();
  const bets: Bet[] = [];
  const spins: SpinRecord[] = [];
  const sessions: GameSession[] = [];
  const rgEvents: RgEvent[] = [];
  let rg = 0;
  const rgAdd = (playerId: string, when: Date, kind: RgEvent["kind"], detail: string) => {
    rg += 1;
    rgEvents.push({ id: `rg_${rg}`, playerId, at: when.toISOString(), kind, detail });
  };

  const placeBet = (
    player: Player,
    when: Date,
    pool: SportEvent[],
    legs: number,
    stake: number,
  ) => {
    const chosen = shuffle(random, pool).slice(0, legs);
    const lines: BetLine[] = chosen.map((event) => {
      const market = random.chance(0.7) ? event.markets[0]! : random.pick(event.markets);
      const selection = random.pick(market.selections);
      return {
        eventId: event.id,
        marketId: market.id,
        selectionId: selection.id,
        odds: selection.odds,
        event: `${event.home} – ${event.away}`,
        market: market.kind,
        selection: selection.label,
        outcome: "pending",
      };
    });
    const odds = combinedOdds(lines.map((l) => l.odds));
    const bet: Bet = {
      id: `b_${bets.length + 1}`,
      code: betCode(bets.length + 1),
      playerId: player.id,
      placedAt: when.toISOString(),
      stake,
      lines,
      odds,
      potentialWin: potentialWin(stake, odds, settings.maxWin),
      status: "open",
      settledAt: null,
      payout: 0,
    };
    book.add(player, when, "bet", -stake, bet.code);
    const settled = settleBet(bet, events, settings.maxWin);
    if (settled.status !== "open") {
      const lastStart = Math.max(...chosen.map((e) => new Date(e.startsAt).getTime()));
      const settledAt = new Date(lastStart + 2.5 * 3_600_000);
      Object.assign(bet, {
        status: settled.status,
        lines: settled.lines,
        payout: settled.payout,
        settledAt: settledAt.toISOString(),
      });
      if (settled.payout > 0)
        book.add(
          player,
          settledAt,
          settled.status === "void" ? "bet_refund" : "bet_win",
          settled.payout,
          bet.code,
        );
    }
    bets.push(bet);
  };

  // --- Giocatore demo -------------------------------------------------------
  const demo = basePlayer(random, DEMO_PLAYER_ID, now, {
    firstName: "Davide",
    lastName: "Conti",
    email: DEMO_EMAIL,
    birthDate: "1990-06-12",
    fiscalCode: demoFiscalCode("Davide", "Conti", "1990-06-12", false),
    city: "Milano",
    document: {
      type: "carta_identita",
      number: "CA00000AA",
      expiresOn: `${now.getFullYear() + 4}-03-31`,
    },
    createdAt: addDays(now, -120).toISOString(),
    lastLoginAt: addDays(now, -2).toISOString(),
    limits: {
      depositDay: null,
      depositWeek: 10_000,
      depositMonth: 30_000,
      lossDay: 5_000,
      sessionMinutes: 120,
    },
    realityCheckMinutes: 30,
  });
  rgAdd(demo.id, new Date(demo.createdAt), "limit_set", "Limiti iniziali alla registrazione");
  const demoDays = [-26, -21, -16, -12, -9, -6, -3, -2];
  for (const d of demoDays) {
    const day = addDays(startOfDay(now), d);
    const start = at(day, random.int(18, 21), random.int(0, 59));
    const session: GameSession = {
      id: `s_${sessions.length + 1}`,
      playerId: demo.id,
      startedAt: start.toISOString(),
      endedAt: addMinutes(start, random.int(25, 70)).toISOString(),
    };
    sessions.push(session);
    if (demo.balance < 3_000)
      book.add(demo, addMinutes(start, 1), "deposit", random.pick([3_000, 5_000]), "Ricarica demo");
    const pool = finished.filter(
      (e) =>
        new Date(e.startsAt).getTime() > start.getTime() &&
        new Date(e.startsAt).getTime() < start.getTime() + 4 * 86_400_000,
    );
    if (pool.length >= 3)
      placeBet(
        demo,
        addMinutes(start, 5),
        pool,
        random.pick([1, 2, 3]),
        random.pick([200, 500, 1_000]),
      );
    if (random.chance(0.6)) {
      const [game, gameName] = random.pick([
        ["frutteto", "Frutteto"],
        ["sette-doro", "Sette d'oro"],
      ] as const);
      const plays = random.int(20, 60);
      const bet = random.pick([20, 50]);
      const win = Math.round(plays * bet * (0.6 + random.next() * 0.6));
      const when = addMinutes(start, 20);
      book.add(demo, when, "spin", -plays * bet, `${gameName} · ${plays} giocate`);
      if (win > 0)
        book.add(demo, addMinutes(when, 1), "spin_win", win, `${gameName} · ${plays} giocate`);
      spins.push({
        id: `sp_${spins.length + 1}`,
        playerId: demo.id,
        game,
        at: when.toISOString(),
        bet: plays * bet,
        win,
      });
    }
  }
  if (demo.balance < 4_000) book.add(demo, addDays(now, -1), "deposit", 5_000, "Ricarica demo");
  const live = upcoming.filter((e) => new Date(e.startsAt) <= now);
  const future = upcoming.filter((e) => new Date(e.startsAt) > now);
  placeBet(demo, addMinutes(now, -150), live, 1, 500);
  placeBet(demo, addMinutes(now, -90), future.slice(0, 10), 2, 500);
  rgAdd(demo.id, addDays(now, -9), "reality_check", "Promemoria dopo 30 minuti: ha continuato");

  // --- Altri giocatori ------------------------------------------------------
  const players: Player[] = [demo];
  for (let i = 1; i <= 30; i += 1) {
    const player = basePlayer(random, `p_${i}`, now);
    if (i <= 3) player.kyc = "pending";
    if (i === 4) player.kyc = "rejected";
    if (i <= 4) player.createdAt = addDays(now, -random.int(1, 12)).toISOString();
    players.push(player);
    rgAdd(player.id, new Date(player.createdAt), "limit_set", "Limiti iniziali alla registrazione");
    if (player.kyc === "rejected") continue;

    const offsets = Array.from({ length: random.int(3, 16) }, () => random.int(0, 29)).sort(
      (a, b) => b - a,
    );
    const nightOwl = i === 7 || i === 12;
    const heavy = i === 7 || i === 9;
    for (const offset of offsets) {
      const day = addDays(startOfDay(now), -offset);
      const hour = nightOwl && random.chance(0.6) ? random.int(1, 4) : random.int(10, 22);
      const start = at(day, hour, random.int(0, 59));
      if (start.getTime() > now.getTime()) continue;
      const minutes = heavy && random.chance(0.5) ? random.int(190, 260) : random.int(15, 90);
      sessions.push({
        id: `s_${sessions.length + 1}`,
        playerId: player.id,
        startedAt: start.toISOString(),
        endedAt: addMinutes(start, minutes).toISOString(),
      });
      const stake = random.int(5, heavy ? 120 : 40) * 100;
      if (player.balance < stake)
        book.add(player, start, "deposit", Math.ceil(stake / 1_000) * 1_000 + 1_000, "Ricarica");
      const kind = random.chance(0.5) ? "bet" : "spin";
      const back = Math.round(
        stake *
          (kind === "spin"
            ? 0.75 + random.next() * 0.4
            : random.chance(0.4)
              ? 1.6 + random.next()
              : 0),
      );
      book.add(
        player,
        addMinutes(start, 2),
        kind,
        -stake,
        kind === "bet" ? "Scommesse del giorno" : "Slot del giorno",
      );
      if (back > 0)
        book.add(
          player,
          addMinutes(start, minutes - 1),
          kind === "bet" ? "bet_win" : "spin_win",
          back,
          kind === "bet" ? "Scommesse del giorno" : "Slot del giorno",
        );
    }
    if (i <= 15 && player.balance >= 500) {
      placeBet(
        player,
        addMinutes(now, -random.int(110, 600)),
        upcoming,
        random.int(1, 4),
        Math.min(player.balance, random.pick([200, 500, 1_000, 2_000])),
      );
    }
    if (i === 9) {
      for (let h = 0; h < 4; h += 1)
        rgAdd(
          player.id,
          addDays(now, -h - 1),
          "limit_hit",
          "Limite di ricarica settimanale raggiunto",
        );
      player.pendingLimits = {
        limits: { ...player.limits, depositWeek: player.limits.depositWeek * 2 },
        effectiveAt: addDays(now, 5).toISOString(),
      };
    }
    if (i === 11) {
      player.selfExclusion = {
        from: addDays(now, -20).toISOString(),
        until: addDays(now, 70).toISOString(),
      };
      rgAdd(player.id, addDays(now, -20), "self_exclusion", "Autoesclusione di 90 giorni");
    }
    if (i === 14) {
      player.pausedUntil = addDays(now, 3).toISOString();
      rgAdd(player.id, addDays(now, -4), "pause", "Pausa di 7 giorni");
    }
    player.lastLoginAt = sessions.filter((s) => s.playerId === player.id).at(-1)?.startedAt ?? null;
  }

  // Saldi progressivi in ordine cronologico (le vincite arrivano a evento concluso).
  const transactions = book.transactions.sort((a, b) => a.at.localeCompare(b.at));
  const running = new Map<string, number>();
  for (const t of transactions) {
    const balance = (running.get(t.playerId) ?? 0) + t.amount;
    running.set(t.playerId, balance);
    t.balanceAfter = balance;
  }
  return { settings, events, players, bets, transactions, spins, sessions, rgEvents };
}
