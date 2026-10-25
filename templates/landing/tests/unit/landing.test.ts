import { describe, expect, it } from "vitest";
import { findPost, posts, sortedPosts } from "@/content/posts";
import { comparison, faq, plans } from "@/content/site";
import {
  acceptAll,
  allows,
  CONSENT_MAX_AGE_DAYS,
  makeConsent,
  parseConsent,
  rejectAll,
} from "@/lib/consent";
import { contactSchema, createRateLimiter, isLikelySpam, MIN_FILL_MS } from "@/lib/contact";
import { annualSavings, pricePerPerson, withVat, yearlyTotal } from "@/lib/pricing";
import { articleJsonLd, faqJsonLd, serializeJsonLd, softwareJsonLd } from "@/lib/seo";

const NOW = new Date("2026-10-21T10:00:00+02:00");
const team = plans.find((p) => p.id === "team")!;
const base = plans.find((p) => p.id === "base")!;
const company = plans.find((p) => p.id === "azienda")!;

describe("prezzi", () => {
  it("applica lo sconto annuale del 20%", () => {
    expect(pricePerPerson(team, "monthly")).toBe(400);
    expect(pricePerPerson(team, "annual")).toBe(320);
    expect(pricePerPerson(base, "annual")).toBe(0);
    expect(pricePerPerson(company, "annual")).toBeNull();
  });

  it("calcola totale annuo e risparmio", () => {
    expect(yearlyTotal(team, "annual", 8)).toBe(30_720);
    expect(yearlyTotal(team, "monthly", 8)).toBe(38_400);
    expect(annualSavings(team, 8)).toBe(7_680);
    expect(yearlyTotal(base, "monthly", 6)).toBeNull();
    expect(annualSavings(company, 10)).toBe(0);
  });

  it("aggiunge l'IVA per i privati", () => {
    expect(withVat(400)).toBe(488);
  });

  it("ha una riga di confronto coerente per ogni piano", () => {
    for (const row of comparison)
      expect(Object.keys(row.values).sort()).toEqual(plans.map((p) => p.id).sort());
  });
});

describe("consenso ai cookie", () => {
  it("salva e rilegge le scelte", () => {
    const consent = makeConsent({ statistics: true, marketing: false }, NOW);
    const parsed = parseConsent(JSON.stringify(consent), NOW);
    expect(parsed).toEqual(consent);
    expect(allows(parsed, "statistics")).toBe(true);
    expect(allows(parsed, "marketing")).toBe(false);
  });

  it("richiede di nuovo il consenso dopo 6 mesi, con una nuova versione o dati non validi", () => {
    const old = acceptAll(new Date(NOW.getTime() - (CONSENT_MAX_AGE_DAYS + 1) * 86_400_000));
    expect(parseConsent(JSON.stringify(old), NOW)).toBeNull();
    expect(parseConsent(JSON.stringify({ ...acceptAll(NOW), version: 0 }), NOW)).toBeNull();
    expect(parseConsent("{non json", NOW)).toBeNull();
    expect(
      parseConsent(JSON.stringify({ version: 1, date: NOW.toISOString(), statistics: "sì" }), NOW),
    ).toBeNull();
    expect(parseConsent(null, NOW)).toBeNull();
  });

  it("senza scelta non consente nulla", () => {
    expect(allows(null, "statistics")).toBe(false);
    expect(rejectAll(NOW)).toMatchObject({ statistics: false, marketing: false });
  });
});

describe("modulo contatti", () => {
  const valid = {
    name: "Ada Neri",
    email: "ada@example.com",
    company: "",
    teamSize: "6-20",
    message: "Vorrei una demo per il negozio.",
    newsletter: false,
  };

  it("valida i campi", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
    const bad = contactSchema.safeParse({ ...valid, email: "ada@", message: "corto" });
    expect(bad.error?.issues.map((i) => i.path[0])).toEqual(["email", "message"]);
    expect(contactSchema.safeParse({ ...valid, teamSize: "1000" }).success).toBe(false);
  });

  it("riconosce gli invii automatici", () => {
    expect(isLikelySpam({ honeypot: "https://spam.example", elapsedMs: 10_000 })).toBe(true);
    expect(isLikelySpam({ honeypot: "", elapsedMs: MIN_FILL_MS - 1 })).toBe(true);
    expect(isLikelySpam({ honeypot: "", elapsedMs: "lento" })).toBe(true);
    expect(isLikelySpam({ honeypot: "", elapsedMs: MIN_FILL_MS + 1 })).toBe(false);
  });

  it("limita la frequenza per chiave e finestra", () => {
    const allow = createRateLimiter(2, 1_000);
    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([true, true, false]);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1_000)).toBe(true);
  });
});

describe("SEO", () => {
  it("pubblica le offerte con prezzo e IVA esclusa", () => {
    const data = softwareJsonLd("https://quadrante.example");
    expect(data.offers.map((o) => o.price)).toEqual(["0.00", "4.00"]);
    expect(data.offers.every((o) => o.valueAddedTaxIncluded === false)).toBe(true);
  });

  it("include tutte le domande frequenti", () => {
    expect(faqJsonLd().mainEntity).toHaveLength(faq.length);
  });

  it("descrive gli articoli e neutralizza i tag", () => {
    const post = posts[0]!;
    expect(articleJsonLd(post, "https://x.example")).toMatchObject({
      headline: post.title,
      datePublished: post.date,
    });
    expect(serializeJsonLd({ a: "</script><script>" })).not.toContain("<");
  });
});

describe("blog", () => {
  it("ordina gli articoli dal più recente e li trova per slug", () => {
    const sorted = sortedPosts();
    expect(sorted.map((p) => p.date)).toEqual([...sorted.map((p) => p.date)].sort().reverse());
    expect(findPost(posts[1]!.slug)).toBe(posts[1]);
    expect(findPost("inesistente")).toBeUndefined();
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
  });
});
