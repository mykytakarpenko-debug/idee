import { describe, expect, it } from "vitest";
import { COURSES, WEEKLY_SLOTS } from "@/lib/demo/seed";
import {
  attendanceRate,
  checkInsPerDay,
  occupancyRate,
  trialConversion,
} from "@/lib/domain/analytics";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { generateSessions, sessionIdFor, sessionsOn, slotsByWeekday } from "@/lib/domain/schedule";
import type { TrialRequest } from "@/lib/domain/types";
import { at, booking, NOW, session } from "./helpers";

describe("palinsesto", () => {
  const week = generateSessions(WEEKLY_SLOTS, COURSES, parseISODate("2026-10-19"), 7);

  it("genera una lezione per ogni slot della settimana", () => {
    expect(week).toHaveLength(WEEKLY_SLOTS.length);
    expect(new Set(week.map((s) => s.id)).size).toBe(week.length);
    const first = week[0]!;
    expect(first.id).toBe(sessionIdFor(first.slotId!, "2026-10-19"));
    expect(first.durationMin).toBe(COURSES.find((c) => c.id === first.courseId)?.durationMin);
  });

  it("non duplica le lezioni già presenti", () => {
    const again = generateSessions(WEEKLY_SLOTS, COURSES, parseISODate("2026-10-19"), 14, week);
    expect(again).toHaveLength(WEEKLY_SLOTS.length);
    expect(again.every((s) => toISODate(new Date(s.start)) >= "2026-10-26")).toBe(true);
  });

  it("ordina le lezioni del giorno e raggruppa il palinsesto", () => {
    const wednesday = sessionsOn(week, "2026-10-21");
    expect(wednesday.map((s) => s.start)).toEqual([...wednesday.map((s) => s.start)].sort());
    const grouped = slotsByWeekday(WEEKLY_SLOTS);
    expect([...grouped.values()].reduce((acc, list) => acc + list.length, 0)).toBe(
      WEEKLY_SLOTS.length,
    );
    expect(grouped.get(7)?.every((s) => s.weekday === 7)).toBe(true);
  });
});

describe("indicatori", () => {
  it("occupazione e presenze", () => {
    const sessions = [
      session({ id: "a", capacity: 4 }),
      session({ id: "b", capacity: 4, cancelled: true }),
    ];
    const bookings = [
      booking({ sessionId: "a", status: "attended" }),
      booking({ sessionId: "a", status: "no_show" }),
      booking({ sessionId: "a", status: "cancelled" }),
      booking({ sessionId: "b" }),
    ];
    expect(
      occupancyRate(sessions, bookings, at("2026-10-22", "00:00"), at("2026-10-23", "00:00")),
    ).toBe(0.5);
    expect(attendanceRate(bookings)).toBe(0.5);
  });

  it("ingressi per giorno, oggi compreso", () => {
    const series = checkInsPerDay(
      [
        { id: "1", memberId: "x", at: at("2026-10-21", "08:00").toISOString() },
        { id: "2", memberId: "y", at: at("2026-10-21", "09:00").toISOString() },
        { id: "3", memberId: "x", at: at("2026-10-19", "18:00").toISOString() },
      ],
      NOW,
      3,
    );
    expect(series).toEqual([
      { date: "2026-10-19", value: 1 },
      { date: "2026-10-20", value: 0 },
      { date: "2026-10-21", value: 2 },
    ]);
  });

  it("conversione delle prove sulle richieste chiuse", () => {
    const trial = (status: TrialRequest["status"]): TrialRequest => ({
      id: status,
      name: "x",
      email: "x@example.com",
      phone: "000",
      interest: "cardio",
      sessionId: null,
      status,
      marketingConsent: false,
      createdAt: NOW.toISOString(),
    });
    expect(
      trialConversion([trial("converted"), trial("lost"), trial("new"), trial("converted")]),
    ).toBeCloseTo(2 / 3);
    expect(trialConversion([])).toBe(0);
  });
});
