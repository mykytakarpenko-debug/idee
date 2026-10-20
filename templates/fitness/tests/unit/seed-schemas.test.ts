import { describe, expect, it } from "vitest";
import { createDemoData, DEMO_MEMBER_ID, DEMO_SETTINGS } from "@/lib/demo/seed";
import { sessionStats } from "@/lib/domain/booking";
import { toISODate } from "@/lib/domain/dates";
import { memberFormSchema, planFormSchema, trialFormSchema } from "@/lib/domain/schemas";
import { createIcsEvent } from "@/lib/ics";
import { gymJsonLd, serializeJsonLd } from "@/lib/seo";
import { at } from "./helpers";

const now = at("2026-10-21", "18:30");
const data = createDemoData(now);

describe("dati demo", () => {
  it("sono deterministici", () => {
    expect(createDemoData(now)).toEqual(data);
  });

  it("nessuna lezione oltre la capienza e nessuna prenotazione doppia", () => {
    for (const s of data.sessions) {
      expect(sessionStats(s, data.bookings, data.trials).taken).toBeLessThanOrEqual(s.capacity);
    }
    const keys = data.bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => `${b.sessionId}|${b.memberId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("riferimenti coerenti", () => {
    const ids = {
      members: new Set(data.members.map((m) => m.id)),
      sessions: new Set(data.sessions.map((s) => s.id)),
      plans: new Set(data.plans.map((p) => p.id)),
    };
    expect(data.members.every((m) => ids.plans.has(m.planId))).toBe(true);
    expect(
      data.bookings.every((b) => ids.members.has(b.memberId) && ids.sessions.has(b.sessionId)),
    ).toBe(true);
    expect(data.checkIns.every((c) => ids.members.has(c.memberId))).toBe(true);
    expect(new Set(data.members.map((m) => m.code)).size).toBe(data.members.length);
  });

  it("stati coerenti con l'ora: niente presenze future né ingressi nel futuro", () => {
    const start = new Map(data.sessions.map((s) => [s.id, new Date(s.start).getTime()]));
    for (const b of data.bookings) {
      if (b.status === "attended" || b.status === "no_show")
        expect(start.get(b.sessionId)!).toBeLessThan(now.getTime());
    }
    expect(data.checkIns.every((c) => new Date(c.at).getTime() <= now.getTime())).toBe(true);
  });

  it("il socio demo ha lezioni prenotate, una lista d'attesa e un ingresso per ogni lezione frequentata", () => {
    const own = data.bookings.filter((b) => b.memberId === DEMO_MEMBER_ID);
    expect(own.some((b) => b.status === "booked")).toBe(true);
    expect(own.some((b) => b.status === "waitlist")).toBe(true);
    const visits = new Set(
      data.checkIns
        .filter((c) => c.memberId === DEMO_MEMBER_ID)
        .map((c) => toISODate(new Date(c.at))),
    );
    for (const b of own.filter((x) => x.status === "attended")) {
      const s = data.sessions.find((x) => x.id === b.sessionId)!;
      expect(visits.has(toISODate(new Date(s.start)))).toBe(true);
    }
  });
});

describe("schemi dei moduli", () => {
  const trial = {
    interest: "cardio" as const,
    sessionId: "",
    name: "Anna Bianchi",
    email: "anna@example.com",
    phone: "+39 333 000 0000",
    adult: true,
    privacy: true,
    marketing: false,
  };

  it("la prova gratuita richiede maggiore età e privacy", () => {
    expect(trialFormSchema.safeParse(trial).success).toBe(true);
    expect(trialFormSchema.safeParse({ ...trial, adult: false }).success).toBe(false);
    expect(trialFormSchema.safeParse({ ...trial, privacy: false }).success).toBe(false);
  });

  it("un carnet richiede ingressi e validità", () => {
    const base = {
      name: "Carnet 5",
      description: "Cinque ingressi",
      billing: "pack" as const,
      price: "60",
      entries: "5",
      validityDays: "60",
      includesGym: true,
      includesClasses: true,
      featured: false,
      perks: "",
    };
    expect(planFormSchema.parse(base).price).toBe(6000);
    expect(planFormSchema.safeParse({ ...base, entries: "" }).success).toBe(false);
    expect(planFormSchema.safeParse({ ...base, billing: "monthly", entries: "" }).success).toBe(
      true,
    );
  });

  it("iscritto: data di inizio obbligatoria, certificato facoltativo", () => {
    const base = {
      firstName: "Anna",
      lastName: "Bianchi",
      email: "anna@example.com",
      phone: "+39 333 000 0000",
      planId: "completo",
      cycle: "monthly" as const,
      start: "2026-10-21",
      medicalCertExpiry: "",
      autoRenew: true,
      marketingConsent: false,
      imageConsent: false,
      notes: "",
    };
    expect(memberFormSchema.safeParse(base).success).toBe(true);
    expect(memberFormSchema.safeParse({ ...base, start: "" }).success).toBe(false);
    expect(memberFormSchema.safeParse({ ...base, medicalCertExpiry: "21/10/2026" }).success).toBe(
      false,
    );
  });
});

describe("esportazioni", () => {
  it("JSON-LD della palestra e serializzazione sicura", () => {
    const ld = gymJsonLd(DEMO_SETTINGS, "https://example.com");
    expect(ld["@type"]).toBe("ExerciseGym");
    expect(ld.openingHoursSpecification).toHaveLength(
      DEMO_SETTINGS.hours.filter((h) => h.open).length,
    );
    expect(serializeJsonLd({ x: "</script>" })).not.toContain("</script>");
  });

  it("evento .ics della lezione", () => {
    const ics = createIcsEvent({
      uid: "s1@forma",
      start: at("2026-10-22", "19:15"),
      end: at("2026-10-22", "20:15"),
      title: "Yoga Flow · Ritmo Club",
      location: "Via dell'Esempio 21, 20121 Milano",
      description: "Studio",
    });
    expect(ics).toContain("DTSTART:20261022T171500Z");
    expect(ics).toContain("LOCATION:Via dell'Esempio 21\\, 20121 Milano");
    expect(ics).toContain("PRODID:-//Forma//Lezioni//IT");
  });
});

describe("cronologia dei dati demo", () => {
  it("nessuna prenotazione creata nel futuro", () => {
    expect(data.bookings.every((b) => new Date(b.createdAt).getTime() <= now.getTime())).toBe(true);
    expect(data.trials.every((t) => new Date(t.createdAt).getTime() <= now.getTime())).toBe(true);
  });
});
