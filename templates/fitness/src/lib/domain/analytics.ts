import { addDays, startOfDay } from "date-fns";
import { holdsSeat } from "./booking";
import { toISODate } from "./dates";
import { membershipStatus } from "./membership";
import type { Booking, CheckIn, ClassSession, Member, TrialRequest } from "./types";

/** Indicatori per la dashboard. Funzioni pure, testate. */

export function activeMembers(
  members: readonly Member[],
  today: Date,
  reminderDays = 14,
): Member[] {
  return members.filter((m) => {
    const status = membershipStatus(m, today, reminderDays);
    return status === "active" || status === "expiring";
  });
}

/** Soci che scadono entro "days" giorni e non hanno il rinnovo automatico. */
export function expiringMembers(members: readonly Member[], today: Date, days: number): Member[] {
  return members
    .filter((m) => membershipStatus(m, today, days) === "expiring")
    .sort((a, b) => a.membershipEnd.localeCompare(b.membershipEnd));
}

/** Ingressi per giorno negli ultimi "days" giorni (oggi compreso). */
export function checkInsPerDay(
  checkIns: readonly CheckIn[],
  today: Date,
  days: number,
): { date: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of checkIns) {
    const key = toISODate(new Date(c.at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const start = addDays(startOfDay(today), -(days - 1));
  return Array.from({ length: days }, (_, i) => {
    const date = toISODate(addDays(start, i));
    return { date, value: counts.get(date) ?? 0 };
  });
}

/** Occupazione media delle lezioni (posti occupati / capienza) in un intervallo. */
export function occupancyRate(
  sessions: readonly ClassSession[],
  bookings: readonly Booking[],
  from: Date,
  to: Date,
): number {
  const inRange = sessions.filter((s) => {
    const ms = new Date(s.start).getTime();
    return !s.cancelled && ms >= from.getTime() && ms < to.getTime();
  });
  const capacity = inRange.reduce((acc, s) => acc + s.capacity, 0);
  if (capacity === 0) return 0;
  const ids = new Set(inRange.map((s) => s.id));
  const taken = bookings.filter((b) => ids.has(b.sessionId) && holdsSeat(b)).length;
  return Math.min(1, taken / capacity);
}

/** Tasso di presenza: presenti / (presenti + assenti) sulle lezioni concluse. */
export function attendanceRate(bookings: readonly Booking[]): number {
  const attended = bookings.filter((b) => b.status === "attended").length;
  const noShow = bookings.filter((b) => b.status === "no_show").length;
  return attended + noShow === 0 ? 0 : attended / (attended + noShow);
}

/** Conversione delle prove gratuite in iscrizioni (sulle richieste chiuse). */
export function trialConversion(trials: readonly TrialRequest[]): number {
  const closed = trials.filter((t) => t.status === "converted" || t.status === "lost");
  if (closed.length === 0) return 0;
  return closed.filter((t) => t.status === "converted").length / closed.length;
}
