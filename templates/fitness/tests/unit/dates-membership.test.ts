import { describe, expect, it } from "vitest";
import { isOpenAt, nextOpening, parseISODate, toISODate, weekDays } from "@/lib/domain/dates";
import {
  annualMonthlyEquivalent,
  annualPrice,
  certificateStatus,
  cyclePrice,
  membershipStatus,
  nextChargeDate,
  renewalPeriod,
} from "@/lib/domain/membership";
import { at, member, NOW, plan, settings } from "./helpers";

describe("date di calendario", () => {
  it("converte senza slittamenti di fuso", () => {
    expect(toISODate(parseISODate("2026-03-29"))).toBe("2026-03-29");
    expect(toISODate(at("2026-10-25", "23:30"))).toBe("2026-10-25");
  });

  it("la settimana parte dal lunedì", () => {
    const days = weekDays(NOW).map(toISODate);
    expect(days[0]).toBe("2026-10-19");
    expect(days[6]).toBe("2026-10-25");
  });

  it("sa se il club è aperto e quando riapre", () => {
    expect(isOpenAt(settings.hours, at("2026-10-21", "07:00"))).toBe(true);
    expect(isOpenAt(settings.hours, at("2026-10-21", "22:30"))).toBe(false);
    expect(isOpenAt(settings.hours, at("2026-10-25", "14:00"))).toBe(false);
    expect(nextOpening(settings.hours, at("2026-10-25", "14:00"))?.toISOString()).toBe(
      at("2026-10-26", "07:00").toISOString(),
    );
  });
});

describe("stato dell'abbonamento", () => {
  it("attivo con rinnovo automatico anche vicino alla scadenza", () => {
    expect(membershipStatus(member({ membershipEnd: "2026-10-25" }), NOW)).toBe("active");
  });

  it("in scadenza senza rinnovo, scaduto dopo la fine", () => {
    expect(membershipStatus(member({ autoRenew: false, membershipEnd: "2026-10-30" }), NOW)).toBe(
      "expiring",
    );
    expect(membershipStatus(member({ autoRenew: false, membershipEnd: "2026-12-30" }), NOW)).toBe(
      "active",
    );
    expect(membershipStatus(member({ membershipEnd: "2026-10-20" }), NOW)).toBe("expired");
  });

  it("scade oggi = ancora valido oggi", () => {
    expect(membershipStatus(member({ autoRenew: false, membershipEnd: "2026-10-21" }), NOW)).toBe(
      "expiring",
    );
  });

  it("carnet: in scadenza con pochi ingressi, scaduto a zero", () => {
    const pack = member({ cycle: "pack", autoRenew: false, membershipEnd: "2026-12-31" });
    expect(membershipStatus({ ...pack, entriesLeft: 5 }, NOW)).toBe("active");
    expect(membershipStatus({ ...pack, entriesLeft: 2 }, NOW)).toBe("expiring");
    expect(membershipStatus({ ...pack, entriesLeft: 0 }, NOW)).toBe("expired");
  });

  it("sospeso ha la precedenza", () => {
    expect(membershipStatus(member({ suspended: true }), NOW)).toBe("suspended");
  });
});

describe("certificato medico", () => {
  it("valido, in scadenza entro 30 giorni, scaduto, mancante", () => {
    expect(certificateStatus("2027-01-01", NOW, true)).toBe("valid");
    expect(certificateStatus("2026-11-10", NOW, true)).toBe("expiring");
    expect(certificateStatus("2026-10-20", NOW, true)).toBe("expired");
    expect(certificateStatus(null, NOW, true)).toBe("missing");
    expect(certificateStatus(null, NOW, false)).toBe("not_required");
  });
});

describe("prezzi e rinnovi", () => {
  it("l'annuale costa 10 mensilità; i carnet non hanno annuale", () => {
    expect(annualPrice(plan("completo"))).toBe(65_000);
    expect(annualMonthlyEquivalent(plan("completo"))).toBe(5417);
    expect(annualPrice(plan("carnet"))).toBeNull();
    expect(cyclePrice(plan("completo"), "annual")).toBe(65_000);
    expect(cyclePrice(plan("carnet"), "pack")).toBe(12_000);
  });

  it("il rinnovo riparte dalla scadenza se ancora valido, da oggi se scaduto", () => {
    expect(renewalPeriod(member({ membershipEnd: "2026-11-04" }), plan("completo"), NOW)).toEqual({
      start: "2026-11-05",
      end: "2026-12-04",
    });
    expect(renewalPeriod(member({ membershipEnd: "2026-09-30" }), plan("completo"), NOW)).toEqual({
      start: "2026-10-21",
      end: "2026-11-20",
    });
    expect(
      renewalPeriod(member({ cycle: "pack", membershipEnd: "2026-09-30" }), plan("carnet"), NOW)
        .end,
    ).toBe("2027-01-18");
  });

  it("prossimo addebito solo con rinnovo automatico", () => {
    expect(nextChargeDate(member())).toBe("2026-11-05");
    expect(nextChargeDate(member({ autoRenew: false }))).toBeNull();
  });
});
