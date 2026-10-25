import { describe, expect, it } from "vitest";
import {
  ageOn,
  fiscalCodeCheckChar,
  fiscalCodeMatchesBirthDate,
  isAdult,
  isValidFiscalCode,
} from "@/lib/domain/kyc";
import {
  changeLimits,
  checkDeposit,
  checkStake,
  depositRemaining,
  effectiveLimits,
  netLossSince,
  playBlock,
  realityCheckDue,
  riskSignals,
  selfTestResult,
  sessionExpired,
  sessionSummary,
} from "@/lib/domain/responsible";
import type { Player, Transaction } from "@/lib/domain/types";
import { demoFiscalCode } from "@/lib/demo/seed";

const NOW = new Date("2026-10-21T10:00:00+02:00");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();

const player = (patch: Partial<Player> = {}): Player => ({
  id: "p",
  firstName: "Davide",
  lastName: "Conti",
  email: "d@example.com",
  birthDate: "1990-06-12",
  fiscalCode: "",
  city: "Milano",
  document: { type: "carta_identita", number: "CA00000AA", expiresOn: "2030-01-01" },
  kyc: "verified",
  createdAt: hoursAgo(1000),
  lastLoginAt: null,
  balance: 10_000,
  limits: {
    depositDay: null,
    depositWeek: 10_000,
    depositMonth: 30_000,
    lossDay: 5_000,
    sessionMinutes: 60,
  },
  pendingLimits: null,
  realityCheckMinutes: 30,
  pausedUntil: null,
  selfExclusion: null,
  cooldownUntil: null,
  operatorNote: "",
  ...patch,
});

let n = 0;
const tx = (kind: Transaction["kind"], amount: number, h: number): Transaction => ({
  id: `t${(n += 1)}`,
  playerId: "p",
  at: hoursAgo(h),
  kind,
  amount,
  balanceAfter: 0,
  ref: "",
});

describe("limiti di ricarica", () => {
  const history = [tx("deposit", 6_000, 30), tx("deposit", 3_000, 200), tx("deposit", 20_000, 900)];

  it("usa il limite residuo più stretto tra 24 ore, 7 e 30 giorni", () => {
    // 7 giorni: 60 € su 100 €; 30 giorni: 90 € su 300 €.
    expect(depositRemaining(player(), history, NOW)).toEqual({ window: "week", remaining: 4_000 });
    expect(checkDeposit(4_000, player(), history, NOW)).toEqual({ ok: true });
    expect(checkDeposit(4_500, player(), history, NOW)).toMatchObject({
      ok: false,
      reason: "limit",
      window: "week",
    });
    const daily = player({ limits: { ...player().limits, depositDay: 1_000 } });
    expect(depositRemaining(daily, [tx("deposit", 500, 2)], NOW)).toEqual({
      window: "day",
      remaining: 500,
    });
  });

  it("blocca le ricariche durante pausa e autoesclusione", () => {
    expect(checkDeposit(100, player({ pausedUntil: hoursAgo(-5) }), [], NOW)).toEqual({
      ok: false,
      reason: "blocked",
    });
  });
});

describe("limite di perdita e puntate", () => {
  it("calcola la perdita netta nelle 24 ore", () => {
    const history = [tx("bet", -3_000, 2), tx("bet_win", 1_000, 1), tx("spin", -2_000, 30)];
    expect(netLossSince(history, "p", NOW.getTime() - 86_400_000)).toBe(2_000);
    expect(checkStake(3_000, player(), history, NOW)).toEqual({ ok: true });
    expect(checkStake(3_500, player(), history, NOW)).toEqual({
      ok: false,
      reason: "loss_limit",
      remaining: 3_000,
    });
    expect(
      checkStake(20_000, player({ limits: { ...player().limits, lossDay: null } }), [], NOW),
    ).toEqual({ ok: false, reason: "balance" });
  });
});

describe("modifica dei limiti", () => {
  const current = player().limits;

  it("applica subito le riduzioni", () => {
    const result = changeLimits(
      current,
      { ...current, depositWeek: 5_000, lossDay: 2_000 },
      NOW,
      7,
    );
    expect(result.limits).toMatchObject({ depositWeek: 5_000, lossDay: 2_000 });
    expect(result.pending).toBeNull();
  });

  it("rimanda aumenti e rimozioni di 7 giorni", () => {
    const next = { ...current, depositWeek: 20_000, lossDay: null, sessionMinutes: 30 };
    const result = changeLimits(current, next, NOW, 7);
    expect(result.limits).toMatchObject({
      depositWeek: 10_000,
      lossDay: 5_000,
      sessionMinutes: 30,
    });
    expect(result.pending?.limits).toEqual(next);
    expect(result.pending?.effectiveAt).toBe(
      new Date(NOW.getTime() + 7 * 86_400_000).toISOString(),
    );
    const later = new Date(NOW.getTime() + 8 * 86_400_000);
    expect(
      effectiveLimits({ limits: result.limits, pendingLimits: result.pending }, later),
    ).toEqual(next);
    expect(effectiveLimits({ limits: result.limits, pendingLimits: result.pending }, NOW)).toEqual(
      result.limits,
    );
  });

  it("considera più restrittivo introdurre un limite che prima non c'era", () => {
    const result = changeLimits(current, { ...current, depositDay: 2_000 }, NOW, 7);
    expect(result.limits.depositDay).toBe(2_000);
    expect(result.pending).toBeNull();
  });
});

describe("blocchi e sessione", () => {
  it("riconosce autoesclusione, pausa e pausa dopo la sessione", () => {
    expect(
      playBlock(player({ selfExclusion: { from: hoursAgo(10), until: null } }), NOW)?.reason,
    ).toBe("self_exclusion");
    expect(
      playBlock(player({ selfExclusion: { from: hoursAgo(100), until: hoursAgo(1) } }), NOW),
    ).toBeNull();
    expect(playBlock(player({ pausedUntil: hoursAgo(-1) }), NOW)?.reason).toBe("pause");
    expect(playBlock(player({ cooldownUntil: hoursAgo(-0.2) }), NOW)?.reason).toBe("cooldown");
    expect(playBlock(player(), NOW)).toBeNull();
  });

  it("chiude la sessione al limite e propone il promemoria a ogni intervallo", () => {
    const session = { startedAt: hoursAgo(1) };
    expect(sessionExpired(session, 60, NOW)).toBe(true);
    expect(sessionExpired(session, 120, NOW)).toBe(false);
    expect(sessionExpired(session, null, NOW)).toBe(false);
    expect(realityCheckDue({ startedAt: hoursAgo(0.4) }, null, 30, NOW)).toBe(false);
    expect(realityCheckDue({ startedAt: hoursAgo(0.6) }, null, 30, NOW)).toBe(true);
    expect(realityCheckDue({ startedAt: hoursAgo(0.6) }, NOW.getTime() - 60_000, 30, NOW)).toBe(
      false,
    );
  });

  it("riassume puntate e vincite della sessione", () => {
    const history = [tx("bet", -500, 0.5), tx("spin_win", 200, 0.2), tx("bet", -1_000, 5)];
    expect(sessionSummary(history, "p", hoursAgo(1))).toEqual({
      staked: 500,
      returned: 200,
      net: -300,
    });
  });
});

describe("segnali e autovalutazione", () => {
  it("segnala limiti raggiunti spesso e aumenti in attesa", () => {
    const rgEvents = [1, 2, 3].map((d) => ({
      id: `e${d}`,
      playerId: "p",
      at: hoursAgo(d * 24),
      kind: "limit_hit" as const,
      detail: "",
    }));
    const p = player({ pendingLimits: { limits: player().limits, effectiveAt: hoursAgo(-48) } });
    expect(riskSignals({ player: p, transactions: [], sessions: [], rgEvents, now: NOW })).toEqual([
      "limit_hits",
      "limit_increase",
    ]);
  });

  it("segnala gioco notturno e sessioni lunghe", () => {
    const night = [1, 2, 3].map((d) => ({
      id: `s${d}`,
      playerId: "p",
      startedAt: `2026-10-${20 - d}T02:30:00+02:00`,
      endedAt: `2026-10-${20 - d}T06:00:00+02:00`,
    }));
    expect(
      riskSignals({ player: player(), transactions: [], sessions: night, rgEvents: [], now: NOW }),
    ).toEqual(["night_play", "long_sessions"]);
  });

  it("interpreta il test Lie/Bet", () => {
    expect(selfTestResult([false, false])).toBe("ok");
    expect(selfTestResult([false, true])).toBe("attention");
  });
});

describe("identità", () => {
  it("verifica la maggiore età al giorno esatto", () => {
    expect(ageOn("2008-10-21", "2026-10-21")).toBe(18);
    expect(isAdult("2008-10-22", "2026-10-21")).toBe(false);
    expect(isAdult("2008-10-21", "2026-10-21")).toBe(true);
  });

  it("valida formato e carattere di controllo del codice fiscale", () => {
    const cf = demoFiscalCode("Davide", "Conti", "1990-06-12", false);
    expect(cf).toBe(`CNTDVD90H12Z000${fiscalCodeCheckChar("CNTDVD90H12Z000")}`);
    expect(isValidFiscalCode(cf)).toBe(true);
    expect(isValidFiscalCode(cf.toLowerCase())).toBe(true);
    expect(isValidFiscalCode(`${cf.slice(0, 15)}${cf[15] === "A" ? "B" : "A"}`)).toBe(false);
    expect(isValidFiscalCode("ABC")).toBe(false);
  });

  it("controlla che il codice fiscale corrisponda alla data di nascita (anche per le donne)", () => {
    expect(
      fiscalCodeMatchesBirthDate(
        demoFiscalCode("Davide", "Conti", "1990-06-12", false),
        "1990-06-12",
      ),
    ).toBe(true);
    expect(
      fiscalCodeMatchesBirthDate(demoFiscalCode("Laura", "Neri", "1995-03-08", true), "1995-03-08"),
    ).toBe(true);
    expect(
      fiscalCodeMatchesBirthDate(demoFiscalCode("Laura", "Neri", "1995-03-08", true), "1995-03-09"),
    ).toBe(false);
  });
});
