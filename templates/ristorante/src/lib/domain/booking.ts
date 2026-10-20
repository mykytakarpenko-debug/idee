import { addMinutes } from "date-fns";
import {
  combineDateAndTime,
  minutesToTime,
  servicesOn,
  timeToMinutes,
  type ServiceKind,
} from "./hours";
import type { DiningTable, Reservation, RestaurantSettings } from "./types";

/**
 * Disponibilità dei tavoli e assegnazione automatica.
 *
 * Regole: un tavolo ospita un solo gruppo alla volta; si assegna il tavolo
 * più piccolo che basta (a parità, il primo in elenco). Le prenotazioni
 * annullate, concluse o "non presentato" liberano il tavolo.
 */

const ACTIVE = new Set<Reservation["status"]>(["requested", "confirmed", "seated"]);

export function isActiveReservation(reservation: Reservation): boolean {
  return ACTIVE.has(reservation.status);
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Tavoli liberi per l'intervallo indicato, dal più adatto al meno adatto. */
export function freeTables(
  tables: readonly DiningTable[],
  reservations: readonly Reservation[],
  start: Date,
  durationMin: number,
  partySize: number,
  ignoreReservationId?: string,
): DiningTable[] {
  const startMs = start.getTime();
  const endMs = addMinutes(start, durationMin).getTime();
  const busy = new Set<string>();
  for (const r of reservations) {
    if (!r.tableId || r.id === ignoreReservationId || !isActiveReservation(r)) continue;
    const rStart = new Date(r.start).getTime();
    if (overlaps(startMs, endMs, rStart, rStart + r.durationMin * 60_000)) busy.add(r.tableId);
  }
  return tables
    .filter((t) => t.seats >= partySize && !busy.has(t.id))
    .sort((a, b) => a.seats - b.seats);
}

export function assignTable(
  tables: readonly DiningTable[],
  reservations: readonly Reservation[],
  start: Date,
  durationMin: number,
  partySize: number,
): DiningTable | null {
  return freeTables(tables, reservations, start, durationMin, partySize)[0] ?? null;
}

export interface Slot {
  time: string;
  service: ServiceKind;
  available: boolean;
}

/**
 * Orari prenotabili in una data per un gruppo, rispettando servizi,
 * ultimo arrivo, anticipo minimo e tavoli liberi.
 */
export function bookingSlots(
  date: string,
  partySize: number,
  settings: RestaurantSettings,
  tables: readonly DiningTable[],
  reservations: readonly Reservation[],
  now: Date,
): Slot[] {
  const day = combineDateAndTime(date, "00:00");
  const { slotMinutes, durationMin, leadTimeMin, lastSeatingBeforeCloseMin } = settings.booking;
  const earliest = now.getTime() + leadTimeMin * 60_000;
  const slots: Slot[] = [];
  for (const { kind, window } of servicesOn(settings.hours, day)) {
    const from = timeToMinutes(window.from);
    const last = timeToMinutes(window.to) - lastSeatingBeforeCloseMin;
    for (let minutes = from; minutes <= last; minutes += slotMinutes) {
      const time = minutesToTime(minutes);
      const start = combineDateAndTime(date, time);
      const available =
        start.getTime() >= earliest &&
        partySize <= settings.booking.maxPartySize &&
        assignTable(tables, reservations, start, durationMin, partySize) !== null;
      slots.push({ time, service: kind, available });
    }
  }
  return slots;
}

/** Coperti (persone) attesi in un intervallo. */
export function coversIn(reservations: readonly Reservation[], start: Date, end: Date): number {
  let total = 0;
  for (const r of reservations) {
    if (r.status === "cancelled" || r.status === "no_show") continue;
    const ms = new Date(r.start).getTime();
    if (ms >= start.getTime() && ms < end.getTime()) total += r.partySize;
  }
  return total;
}

/** Codice prenotazione leggibile: lettere e cifre senza caratteri ambigui. */
export function reservationCode(prefix: string, random: () => number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i += 1) code += alphabet[Math.floor(random() * alphabet.length)];
  return `${prefix}-${code}`;
}
