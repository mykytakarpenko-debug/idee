/**
 * Modello dati di Arena (scommesse sportive e giochi con strumenti di gioco responsabile).
 * Importi in centesimi (interi); quote in centesimi di unità (185 = 1,85); date ISO.
 * In demo i crediti non hanno alcun valore e non esistono pagamenti.
 */

export type ID = string;
export type Cents = number;
/** Data di calendario "YYYY-MM-DD". */
export type ISODate = string;
/** Istante ISO 8601. */
export type ISODateTime = string;

// ---------------------------------------------------------------------------
// Scommesse
// ---------------------------------------------------------------------------

export type Sport = "calcio" | "tennis" | "basket";

/** Quota decimale in centesimi: 185 = 1,85. */
export type Odds = number;

export interface Selection {
  id: ID;
  /** Esito breve: "1", "X", "2", "Over", "Goal", nome del giocatore… */
  label: string;
  odds: Odds;
}

/** 1X2 e Under/Over 2,5 e Goal/No goal nel calcio; testa a testa (12) per tennis e basket. */
export type MarketKind = "1X2" | "OU25" | "GGNG" | "12";

export interface Market {
  id: ID;
  kind: MarketKind;
  selections: Selection[];
}

export type EventStatus = "scheduled" | "finished" | "cancelled";

export interface Score {
  home: number;
  away: number;
}

export interface SportEvent {
  id: ID;
  sport: Sport;
  competition: string;
  home: string;
  away: string;
  startsAt: ISODateTime;
  status: EventStatus;
  score: Score | null;
  markets: Market[];
}

export type LineOutcome = "pending" | "won" | "lost" | "void";

export interface BetLine {
  eventId: ID;
  marketId: ID;
  selectionId: ID;
  /** Quota accettata al momento della giocata. */
  odds: Odds;
  event: string;
  market: MarketKind;
  selection: string;
  outcome: LineOutcome;
}

export type BetStatus = "open" | "won" | "lost" | "void";

export interface Bet {
  id: ID;
  /** Codice della scommessa (in produzione: codice ADM del biglietto). */
  code: string;
  playerId: ID;
  placedAt: ISODateTime;
  stake: Cents;
  lines: BetLine[];
  /** Quota totale (prodotto delle quote, in centesimi). */
  odds: Odds;
  potentialWin: Cents;
  status: BetStatus;
  settledAt: ISODateTime | null;
  payout: Cents;
}

// ---------------------------------------------------------------------------
// Giocatori, conto e gioco responsabile
// ---------------------------------------------------------------------------

export type KycStatus = "pending" | "verified" | "rejected";
export type DocumentType = "carta_identita" | "patente" | "passaporto";

/** Limiti scelti dal giocatore; null = nessun limite (tranne la ricarica settimanale, obbligatoria). */
export interface Limits {
  depositDay: Cents | null;
  depositWeek: Cents;
  depositMonth: Cents | null;
  /** Perdita netta massima nelle ultime 24 ore. */
  lossDay: Cents | null;
  /** Durata massima di una sessione di gioco. */
  sessionMinutes: number | null;
}

export interface PendingLimits {
  limits: Limits;
  /** Gli aumenti hanno effetto solo dopo il periodo di attesa. */
  effectiveAt: ISODateTime;
}

export interface Player {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: ISODate;
  fiscalCode: string;
  city: string;
  document: { type: DocumentType; number: string; expiresOn: ISODate };
  kyc: KycStatus;
  createdAt: ISODateTime;
  lastLoginAt: ISODateTime | null;
  balance: Cents;
  limits: Limits;
  pendingLimits: PendingLimits | null;
  /** Promemoria del tempo di gioco, in minuti. */
  realityCheckMinutes: number;
  /** Pausa volontaria presso questo operatore. */
  pausedUntil: ISODateTime | null;
  /** Autoesclusione (in produzione: Registro unico delle autoesclusioni di ADM). */
  selfExclusion: { from: ISODateTime; until: ISODateTime | null } | null;
  /** Dopo il limite di sessione: nuovo accesso possibile da questo istante. */
  cooldownUntil: ISODateTime | null;
  /** Nota interna dell'operatore (gioco responsabile, verifiche). */
  operatorNote: string;
}

export type TransactionKind =
  "deposit" | "withdrawal" | "bet" | "bet_win" | "bet_refund" | "spin" | "spin_win";

export interface Transaction {
  id: ID;
  playerId: ID;
  at: ISODateTime;
  kind: TransactionKind;
  /** Con segno: positivo accredita, negativo addebita. */
  amount: Cents;
  balanceAfter: Cents;
  /** Riferimento: codice scommessa, gioco, metodo. */
  ref: string;
}

export interface GameSession {
  id: ID;
  playerId: ID;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
}

/** Eventi rilevanti per il gioco responsabile, visibili all'operatore. */
export type RgEventKind =
  | "limit_set"
  | "limit_hit"
  | "reality_check"
  | "session_limit"
  | "pause"
  | "self_exclusion"
  | "self_test";

export interface RgEvent {
  id: ID;
  playerId: ID;
  at: ISODateTime;
  kind: RgEventKind;
  detail: string;
}

// ---------------------------------------------------------------------------
// Giochi
// ---------------------------------------------------------------------------

export interface SpinRecord {
  id: ID;
  playerId: ID;
  game: string;
  at: ISODateTime;
  bet: Cents;
  win: Cents;
}

export interface OperatorSettings {
  name: string;
  company: string;
  vatNumber: string;
  address: string;
  email: string;
  /** Concessione ADM (segnaposto in demo). */
  license: string;
  minStake: Cents;
  maxStake: Cents;
  maxWin: Cents;
  maxLines: number;
  /** Giorni di attesa prima che un aumento dei limiti abbia effetto. */
  limitIncreaseDays: number;
}

export interface DataSnapshot {
  settings: OperatorSettings;
  events: SportEvent[];
  players: Player[];
  bets: Bet[];
  transactions: Transaction[];
  spins: SpinRecord[];
  sessions: GameSession[];
  rgEvents: RgEvent[];
}
