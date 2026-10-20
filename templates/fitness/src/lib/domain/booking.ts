import { addDays, startOfDay } from "date-fns";
import { toISODate } from "./dates";
import { certificateStatus, membershipStatus } from "./membership";
import type { Booking, ClassSession, ClubSettings, Member, Plan, TrialRequest } from "./types";

/**
 * Prenotazione delle lezioni: posti, lista d'attesa e regole.
 * Le stesse funzioni vanno usate lato server quando colleghi un backend.
 */

export interface SessionStats {
  /** Posti occupati (prenotati, presenti e prove gratuite). */
  taken: number;
  free: number;
  waitlist: number;
  full: boolean;
}

const HOLDS_SEAT = new Set<Booking["status"]>(["booked", "attended", "no_show"]);
const OPEN_TRIAL = new Set<TrialRequest["status"]>(["new", "contacted"]);

export function holdsSeat(booking: Pick<Booking, "status">): boolean {
  return HOLDS_SEAT.has(booking.status);
}

export function sessionStats(
  session: Pick<ClassSession, "id" | "capacity">,
  bookings: readonly Booking[],
  trials: readonly TrialRequest[] = [],
): SessionStats {
  let taken = 0;
  let waitlist = 0;
  for (const b of bookings) {
    if (b.sessionId !== session.id) continue;
    if (holdsSeat(b)) taken += 1;
    else if (b.status === "waitlist") waitlist += 1;
  }
  for (const t of trials) if (t.sessionId === session.id && OPEN_TRIAL.has(t.status)) taken += 1;
  const free = Math.max(0, session.capacity - taken);
  return { taken, free, waitlist, full: free === 0 };
}

/** Posizione in lista d'attesa (1 = primo) o null. */
export function waitlistPosition(booking: Booking, bookings: readonly Booking[]): number | null {
  if (booking.status !== "waitlist") return null;
  const queue = bookings
    .filter((b) => b.sessionId === booking.sessionId && b.status === "waitlist")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return queue.findIndex((b) => b.id === booking.id) + 1;
}

/** Prima prenotazione in lista d'attesa da promuovere quando si libera un posto. */
export function nextInWaitlist(sessionId: string, bookings: readonly Booking[]): Booking | null {
  return (
    bookings
      .filter((b) => b.sessionId === sessionId && b.status === "waitlist")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] ?? null
  );
}

export type BookingBlock =
  | "past"
  | "too_far"
  | "session_cancelled"
  | "already_booked"
  | "membership_inactive"
  | "plan_excludes_classes"
  | "no_entries"
  | "certificate"
  | "daily_limit"
  | "full";

export type BookingCheck = { ok: true; waitlist: boolean } | { ok: false; reason: BookingBlock };

export interface BookingContext {
  member: Member;
  plan: Plan | undefined;
  session: ClassSession;
  sessions: readonly ClassSession[];
  bookings: readonly Booking[];
  trials?: readonly TrialRequest[];
  settings: ClubSettings;
  now: Date;
}

/**
 * Può il socio prenotare la lezione? Restituisce anche se finirà in lista d'attesa.
 * L'ordine dei controlli va dal più generale al più specifico, così il messaggio
 * mostrato è sempre il più utile.
 */
export function checkBooking(ctx: BookingContext): BookingCheck {
  const { member, plan, session, sessions, bookings, settings, now } = ctx;
  const start = new Date(session.start);
  if (session.cancelled) return { ok: false, reason: "session_cancelled" };
  if (start.getTime() <= now.getTime()) return { ok: false, reason: "past" };
  const lastDay = addDays(startOfDay(now), settings.booking.windowDays + 1);
  if (start.getTime() >= lastDay.getTime()) return { ok: false, reason: "too_far" };

  const own = bookings.filter((b) => b.memberId === member.id);
  if (
    own.some(
      (b) => b.sessionId === session.id && (b.status === "booked" || b.status === "waitlist"),
    )
  ) {
    return { ok: false, reason: "already_booked" };
  }

  // Carnet esaurito: messaggio specifico, prima dello stato generico dell'abbonamento.
  if (member.entriesLeft !== null && member.entriesLeft <= 0) {
    return { ok: false, reason: "no_entries" };
  }
  const status = membershipStatus(member, now, settings.reminderDays);
  if (status === "expired" || status === "suspended") {
    return { ok: false, reason: "membership_inactive" };
  }
  if (member.membershipEnd < toISODate(start)) return { ok: false, reason: "membership_inactive" };
  if (!plan?.includesClasses) return { ok: false, reason: "plan_excludes_classes" };

  const cert = certificateStatus(member.medicalCertExpiry, start, settings.requireMedicalCert);
  if (cert === "expired" || cert === "missing") return { ok: false, reason: "certificate" };

  const day = toISODate(start);
  const sessionDay = new Map(sessions.map((s) => [s.id, toISODate(new Date(s.start))]));
  const sameDay = own.filter(
    (b) =>
      (b.status === "booked" || b.status === "waitlist") && sessionDay.get(b.sessionId) === day,
  ).length;
  if (sameDay >= settings.booking.maxDailyBookings) return { ok: false, reason: "daily_limit" };

  const stats = sessionStats(session, bookings, ctx.trials);
  if (stats.full) {
    return settings.booking.waitlistEnabled
      ? { ok: true, waitlist: true }
      : { ok: false, reason: "full" };
  }
  return { ok: true, waitlist: false };
}

/**
 * Cancellazione: sempre possibile prima dell'inizio. Entro il termine
 * (es. 6 ore prima) è "tardiva": per i carnet l'ingresso non viene restituito.
 */
export function cancellationInfo(
  booking: Pick<Booking, "status">,
  session: Pick<ClassSession, "start">,
  settings: Pick<ClubSettings, "booking">,
  now: Date,
): { allowed: boolean; late: boolean } {
  const start = new Date(session.start).getTime();
  if (booking.status !== "booked" && booking.status !== "waitlist")
    return { allowed: false, late: false };
  if (start <= now.getTime()) return { allowed: false, late: false };
  const late =
    booking.status === "booked" && start - now.getTime() < settings.booking.cancelHours * 3_600_000;
  return { allowed: true, late };
}
