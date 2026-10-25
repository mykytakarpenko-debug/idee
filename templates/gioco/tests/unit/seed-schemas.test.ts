import { describe, expect, it } from "vitest";
import { dailyActivity, operatorKpis } from "@/lib/domain/analytics";
import { isValidFiscalCode } from "@/lib/domain/kyc";
import { registrationSchema, limitsSchema } from "@/lib/domain/schemas";
import { createDemoData, DEMO_EMAIL, DEMO_PLAYER_ID, demoFiscalCode } from "@/lib/demo/seed";

const NOW = new Date("2026-10-21T10:00:00+02:00");

describe("dati demo", () => {
  const data = createDemoData(NOW);

  it("sono deterministici", () => {
    expect(createDemoData(NOW)).toEqual(data);
  });

  it("hanno un giocatore demo verificato con saldo coerente", () => {
    const demo = data.players.find((p) => p.id === DEMO_PLAYER_ID)!;
    expect(demo.email).toBe(DEMO_EMAIL);
    expect(demo.kyc).toBe("verified");
    const sum = data.transactions
      .filter((t) => t.playerId === demo.id)
      .reduce((a, t) => a + t.amount, 0);
    expect(demo.balance).toBe(sum);
    expect(data.bets.some((b) => b.playerId === demo.id && b.status === "open")).toBe(true);
  });

  it("usano solo codici fiscali validi e fittizi (comune Z000)", () => {
    for (const p of data.players) {
      expect(isValidFiscalCode(p.fiscalCode)).toBe(true);
      expect(p.fiscalCode.slice(11, 15)).toBe("Z000");
    }
  });

  it("collegano scommesse, eventi e movimenti", () => {
    const events = new Set(data.events.map((e) => e.id));
    for (const bet of data.bets) {
      for (const line of bet.lines) expect(events.has(line.eventId)).toBe(true);
      expect(new Date(bet.placedAt) <= NOW).toBe(true);
    }
    for (const t of data.transactions)
      expect(new Date(t.at).getTime()).toBeLessThanOrEqual(NOW.getTime() + 60_000);
  });

  it("prevedono eventi futuri, uno da refertare e giocatori da seguire", () => {
    expect(
      data.events.filter((e) => e.status === "scheduled" && new Date(e.startsAt) > NOW).length,
    ).toBeGreaterThan(20);
    expect(data.events.some((e) => e.status === "scheduled" && new Date(e.startsAt) <= NOW)).toBe(
      true,
    );
    const kpis = operatorKpis(data, NOW);
    expect(kpis.pendingKyc).toBe(3);
    expect(kpis.blocked).toBe(2);
    expect(kpis.openBets).toBeGreaterThan(5);
    expect(dailyActivity(data.transactions, NOW, 30)).toHaveLength(30);
  });
});

describe("schemi", () => {
  const schema = registrationSchema(() => "2026-10-21");
  const valid = {
    firstName: "Laura",
    lastName: "Neri",
    birthDate: "1995-03-08",
    fiscalCode: demoFiscalCode("Laura", "Neri", "1995-03-08", true).toLowerCase(),
    city: "Bologna",
    email: "laura@example.com",
    password: "password-lunga",
    documentType: "carta_identita" as const,
    documentNumber: "CA12345BB",
    documentExpiresOn: "2029-01-01",
    depositWeek: "100",
    terms: true,
    privacy: true,
  };

  it("accettano una registrazione valida e normalizzano il codice fiscale", () => {
    const parsed = schema.parse(valid);
    expect(parsed.fiscalCode).toBe(valid.fiscalCode.toUpperCase());
    expect(parsed.depositWeek).toBe(10_000);
  });

  it("rifiutano minorenni, documenti scaduti, codici incoerenti e consensi mancanti", () => {
    const issues = (patch: Partial<typeof valid>) =>
      schema.safeParse({ ...valid, ...patch }).error?.issues.map((i) => i.path[0]) ?? [];
    expect(issues({ birthDate: "2009-01-01" })).toContain("birthDate");
    expect(issues({ documentExpiresOn: "2026-10-20" })).toContain("documentExpiresOn");
    expect(issues({ fiscalCode: "XXXXXX00A00Z000X" })).toContain("fiscalCode");
    expect(issues({ birthDate: "1995-03-09" })).toContain("fiscalCode");
    expect(issues({ terms: false })).toContain("terms");
    expect(issues({ depositWeek: "5" })).toContain("depositWeek");
  });

  it("convertono i limiti: vuoto = nessun limite", () => {
    const parsed = limitsSchema.parse({
      depositDay: "",
      depositWeek: "50",
      depositMonth: "200",
      lossDay: "",
      sessionMinutes: "60",
      realityCheckMinutes: "15",
    });
    expect(parsed).toEqual({
      depositDay: null,
      depositWeek: 5_000,
      depositMonth: 20_000,
      lossDay: null,
      sessionMinutes: 60,
      realityCheckMinutes: 15,
    });
  });
});
