import { describe, expect, it } from "vitest";
import {
  cancellationInfo,
  checkBooking,
  nextInWaitlist,
  sessionStats,
  waitlistPosition,
  type BookingContext,
} from "@/lib/domain/booking";
import { checkInEligibility } from "@/lib/domain/checkin";
import type { TrialRequest } from "@/lib/domain/types";
import { at, booking, member, NOW, plan, session, settings } from "./helpers";

function ctx(patch: Partial<BookingContext> = {}): BookingContext {
  const s = patch.session ?? session();
  return {
    member: member(),
    plan: plan("completo"),
    session: s,
    sessions: [s],
    bookings: [],
    trials: [],
    settings,
    now: NOW,
    ...patch,
  };
}

describe("posti e lista d'attesa", () => {
  it("conta prenotati, presenti e prove gratuite aperte", () => {
    const trial: TrialRequest = {
      id: "t1",
      name: "Prova",
      email: "p@example.com",
      phone: "000",
      interest: "mente_corpo",
      sessionId: "s1",
      status: "new",
      marketingConsent: false,
      createdAt: NOW.toISOString(),
    };
    const stats = sessionStats(
      session({ capacity: 3 }),
      [booking(), booking({ status: "cancelled" })],
      [trial],
    );
    expect(stats).toEqual({ taken: 2, free: 1, waitlist: 0, full: false });
  });

  it("la lista d'attesa segue l'ordine di arrivo", () => {
    const first = booking({ status: "waitlist" });
    const second = booking({ status: "waitlist" });
    const list = [second, first];
    expect(nextInWaitlist("s1", list)?.id).toBe(first.id);
    expect(waitlistPosition(second, list)).toBe(2);
  });
});

describe("regole di prenotazione", () => {
  it("prenota se c'è posto, altrimenti lista d'attesa", () => {
    expect(checkBooking(ctx())).toEqual({ ok: true, waitlist: false });
    const full = [booking(), booking()];
    expect(checkBooking(ctx({ bookings: full }))).toEqual({ ok: true, waitlist: true });
    const noWaitlist = { ...settings, booking: { ...settings.booking, waitlistEnabled: false } };
    expect(checkBooking(ctx({ bookings: full, settings: noWaitlist }))).toEqual({
      ok: false,
      reason: "full",
    });
  });

  it.each([
    ["past", ctx({ session: session({ start: at("2026-10-21", "09:30").toISOString() }) })],
    ["too_far", ctx({ session: session({ start: at("2026-10-30", "19:15").toISOString() }) })],
    ["session_cancelled", ctx({ session: session({ cancelled: true }) })],
    ["membership_inactive", ctx({ member: member({ membershipEnd: "2026-10-01" }) })],
    [
      "membership_inactive",
      ctx({ member: member({ membershipEnd: "2026-10-21", autoRenew: false }) }),
    ],
    ["plan_excludes_classes", ctx({ plan: plan("open") })],
    [
      "no_entries",
      ctx({ member: member({ entriesLeft: 0, cycle: "pack", membershipEnd: "2026-12-01" }) }),
    ],
    ["certificate", ctx({ member: member({ medicalCertExpiry: "2026-10-21" }) })],
    ["certificate", ctx({ member: member({ medicalCertExpiry: null }) })],
  ] as const)("blocca con motivo %s", (reason, context) => {
    expect(checkBooking(context)).toEqual({ ok: false, reason });
  });

  it("non permette doppie prenotazioni né oltre il limite giornaliero", () => {
    const own = booking({ memberId: "m_test" });
    expect(checkBooking(ctx({ bookings: [own] }))).toEqual({ ok: false, reason: "already_booked" });
    const morning = session({ id: "s0", start: at("2026-10-22", "07:30").toISOString() });
    const noon = session({ id: "s2", start: at("2026-10-22", "12:45").toISOString() });
    const evening = session();
    const result = checkBooking(
      ctx({
        session: evening,
        sessions: [morning, noon, evening],
        bookings: [
          booking({ memberId: "m_test", sessionId: "s0" }),
          booking({ memberId: "m_test", sessionId: "s2" }),
        ],
      }),
    );
    expect(result).toEqual({ ok: false, reason: "daily_limit" });
  });

  it("la cancellazione entro il termine è tardiva", () => {
    const s = session({ start: at("2026-10-21", "14:00").toISOString() });
    expect(cancellationInfo(booking(), s, settings, NOW)).toEqual({ allowed: true, late: true });
    expect(cancellationInfo(booking({ status: "waitlist" }), s, settings, NOW)).toEqual({
      allowed: true,
      late: false,
    });
    expect(cancellationInfo(booking(), session(), settings, NOW)).toEqual({
      allowed: true,
      late: false,
    });
    expect(cancellationInfo(booking({ status: "attended" }), s, settings, NOW).allowed).toBe(false);
  });
});

describe("check-in", () => {
  const completo = plan("completo");

  it("consente l'ingresso con abbonamento e certificato validi", () => {
    expect(checkInEligibility(member(), completo, [], settings, NOW)).toEqual({
      ok: true,
      blocks: [],
      warnings: [],
    });
  });

  it("blocca scaduti, sospesi, carnet esauriti e certificati non validi", () => {
    expect(
      checkInEligibility(member({ membershipEnd: "2026-10-01" }), completo, [], settings, NOW)
        .blocks,
    ).toEqual(["expired"]);
    expect(
      checkInEligibility(member({ suspended: true }), completo, [], settings, NOW).blocks,
    ).toEqual(["suspended"]);
    expect(
      checkInEligibility(
        member({ cycle: "pack", entriesLeft: 0, membershipEnd: "2026-12-01" }),
        plan("carnet"),
        [],
        settings,
        NOW,
      ).blocks,
    ).toEqual(["no_entries"]);
    expect(
      checkInEligibility(member({ medicalCertExpiry: "2026-10-01" }), completo, [], settings, NOW)
        .blocks,
    ).toEqual(["certificate_expired"]);
  });

  it("avvisa senza bloccare", () => {
    const result = checkInEligibility(
      member({
        medicalCertExpiry: "2026-11-01",
        cycle: "pack",
        entriesLeft: 1,
        autoRenew: false,
        membershipEnd: "2026-12-20",
      }),
      plan("carnet"),
      [{ id: "c1", memberId: "m_test", at: at("2026-10-21", "08:00").toISOString() }],
      settings,
      NOW,
    );
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "membership_expiring",
        "last_entry",
        "certificate_expiring",
        "already_today",
      ]),
    );
  });
});
