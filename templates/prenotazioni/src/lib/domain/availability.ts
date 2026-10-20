import { addDays, addMinutes, startOfDay } from "date-fns";
import {
  combineDateAndTime,
  isoWeekday,
  isWithin,
  parseISODate,
  timeToMinutes,
  toISODate,
} from "./dates";
import type {
  Appointment,
  AppointmentStatus,
  BusinessSettings,
  DataSnapshot,
  ISODate,
  Service,
  TimeOff,
  TimeRange,
} from "./types";

/**
 * Disponibilità: dagli orari settimanali dei professionisti agli orari
 * prenotabili, togliendo pause, assenze, appuntamenti già presi (con il
 * loro buffer), anticipo minimo e orizzonte. Funzioni pure, testate.
 * Le stesse funzioni vanno rieseguite lato server prima di confermare.
 */

export const ANY_STAFF = "any";

/** Stati che occupano l'agenda. */
const BLOCKING = new Set<AppointmentStatus>(["pending", "confirmed"]);

export function isBlocking(appointment: Pick<Appointment, "status">): boolean {
  return BLOCKING.has(appointment.status);
}

export interface Slot {
  start: Date;
  end: Date;
  /** Professionisti liberi a quell'ora, in ordine di preferenza. */
  staffIds: string[];
}

export interface SlotQuery {
  service: Service;
  staffId: string;
  date: ISODate;
  data: Pick<DataSnapshot, "services" | "hours" | "timeOff" | "appointments">;
  booking: BusinessSettings["booking"];
  now: Date;
  /** Appuntamento da ignorare (quando lo si sposta). */
  ignoreAppointmentId?: string;
}

interface Interval {
  start: number;
  end: number;
}

/** Fasce di lavoro di un professionista in una data (vuote se assente o studio chiuso). */
export function workingIntervals(
  staffId: string,
  date: ISODate,
  data: Pick<DataSnapshot, "hours" | "timeOff">,
): Interval[] {
  const off = data.timeOff.some(
    (t) => (t.staffId === null || t.staffId === staffId) && isWithin(date, t.from, t.to),
  );
  if (off) return [];
  const weekday = isoWeekday(parseISODate(date));
  const entry = data.hours.find((h) => h.staffId === staffId && h.day === weekday);
  return (entry?.ranges ?? []).map((range) => ({
    start: combineDateAndTime(date, range.from).getTime(),
    end: combineDateAndTime(date, range.to).getTime(),
  }));
}

/** Intervalli occupati (appuntamento + buffer del suo servizio). */
function busyIntervals(
  staffId: string,
  data: Pick<DataSnapshot, "services" | "appointments">,
  ignoreId?: string,
): Interval[] {
  const buffer = new Map(data.services.map((s) => [s.id, s.bufferMin]));
  return data.appointments
    .filter((a) => a.staffId === staffId && a.id !== ignoreId && isBlocking(a))
    .map((a) => ({
      start: new Date(a.start).getTime(),
      end: new Date(a.end).getTime() + (buffer.get(a.serviceId) ?? 0) * 60_000,
    }));
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** Orari di inizio liberi per un professionista in una data. */
export function staffSlots(query: SlotQuery, staffId: string): Date[] {
  const { service, date, data, booking, now } = query;
  const earliest = now.getTime() + booking.leadTimeHours * 3_600_000;
  const lastDay = toISODate(addDays(startOfDay(now), booking.horizonDays));
  if (date > lastDay) return [];
  const busy = busyIntervals(staffId, data, query.ignoreAppointmentId);
  const step = booking.slotStepMin;
  const slots: Date[] = [];
  for (const range of workingIntervals(staffId, date, data)) {
    // Primo orario allineato al passo (es. 9:00, 9:30…) a partire dall'inizio della fascia.
    const rangeStart = new Date(range.start);
    const minutes = rangeStart.getHours() * 60 + rangeStart.getMinutes();
    let t = addMinutes(rangeStart, (step - (minutes % step)) % step).getTime();
    for (; t + service.durationMin * 60_000 <= range.end; t += step * 60_000) {
      if (t < earliest) continue;
      const block = { start: t, end: t + (service.durationMin + service.bufferMin) * 60_000 };
      if (busy.some((b) => overlaps(block, b))) continue;
      slots.push(new Date(t));
    }
  }
  return slots;
}

/** Orari prenotabili per un servizio, con un professionista o "primo disponibile". */
export function availableSlots(query: SlotQuery): Slot[] {
  const { service } = query;
  const candidates =
    query.staffId === ANY_STAFF
      ? service.staffIds
      : service.staffIds.filter((id) => id === query.staffId);
  const byStart = new Map<number, string[]>();
  for (const staffId of candidates) {
    for (const start of staffSlots(query, staffId)) {
      const key = start.getTime();
      byStart.set(key, [...(byStart.get(key) ?? []), staffId]);
    }
  }
  return [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, staffIds]) => ({
      start: new Date(start),
      end: new Date(start + service.durationMin * 60_000),
      staffIds,
    }));
}

/**
 * "Primo disponibile": sceglie chi ha meno appuntamenti quel giorno,
 * a parità nell'ordine indicato dal servizio (distribuisce il lavoro).
 */
export function pickStaff(
  staffIds: readonly string[],
  appointments: readonly Appointment[],
  date: ISODate,
): string {
  const load = (id: string) =>
    appointments.filter(
      (a) => a.staffId === id && isBlocking(a) && toISODate(new Date(a.start)) === date,
    ).length;
  return [...staffIds].sort((a, b) => load(a) - load(b))[0] ?? staffIds[0] ?? "";
}

/** Giorni con almeno un orario libero, da oggi per "days" giorni (per il calendario). */
export function availableDays(query: Omit<SlotQuery, "date">, days: number): Set<ISODate> {
  const result = new Set<ISODate>();
  const today = startOfDay(query.now);
  for (let i = 0; i <= days; i += 1) {
    const date = toISODate(addDays(today, i));
    if (availableSlots({ ...query, date }).length > 0) result.add(date);
  }
  return result;
}

/**
 * Occupazione dell'agenda: minuti prenotati / minuti di apertura dei
 * professionisti, nei "days" giorni a partire da "from".
 */
export function occupancy(
  data: Pick<DataSnapshot, "staff" | "hours" | "timeOff" | "appointments">,
  from: Date,
  days: number,
): number {
  let open = 0;
  let booked = 0;
  for (let i = 0; i < days; i += 1) {
    const date = toISODate(addDays(startOfDay(from), i));
    for (const person of data.staff) {
      const ranges = workingIntervals(person.id, date, data);
      open += ranges.reduce((acc, r) => acc + (r.end - r.start), 0);
      for (const a of data.appointments) {
        if (a.staffId !== person.id || !isBlocking(a) || toISODate(new Date(a.start)) !== date)
          continue;
        booked += new Date(a.end).getTime() - new Date(a.start).getTime();
      }
    }
  }
  return open === 0 ? 0 : Math.min(1, booked / open);
}

/** Fasce orarie valide: ognuna finisce dopo l'inizio e non si sovrappongono. */
export function rangesValid(ranges: readonly TimeRange[]): boolean {
  const sorted = [...ranges].sort((a, b) => timeToMinutes(a.from) - timeToMinutes(b.from));
  return sorted.every((range, i) => {
    const from = timeToMinutes(range.from);
    const to = timeToMinutes(range.to);
    const prev = sorted[i - 1];
    return to > from && (!prev || from >= timeToMinutes(prev.to));
  });
}

/** Appuntamenti attivi che cadono in un periodo di assenza (da avvisare). */
export function conflictsWithTimeOff(
  appointments: readonly Appointment[],
  timeOff: Pick<TimeOff, "staffId" | "from" | "to">,
): Appointment[] {
  return appointments.filter(
    (a) =>
      isBlocking(a) &&
      (timeOff.staffId === null || a.staffId === timeOff.staffId) &&
      isWithin(toISODate(new Date(a.start)), timeOff.from, timeOff.to),
  );
}

/** Il cliente può ancora spostare o cancellare online? */
export function manageability(
  appointment: Pick<Appointment, "status" | "start">,
  booking: Pick<BusinessSettings["booking"], "cancelHours">,
  now: Date,
): { allowed: boolean; reason?: "closed" | "past" | "too_late" } {
  if (!isBlocking(appointment)) return { allowed: false, reason: "closed" };
  const start = new Date(appointment.start).getTime();
  if (start <= now.getTime()) return { allowed: false, reason: "past" };
  if (start - now.getTime() < booking.cancelHours * 3_600_000)
    return { allowed: false, reason: "too_late" };
  return { allowed: true };
}

/** Codice di prenotazione leggibile, senza caratteri ambigui (0/O, 1/I). */
export function bookingCode(random: () => number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(random() * alphabet.length)];
  return `AG-${code}`;
}

/** Stato iniziale di una prenotazione online. */
export function initialStatus(service: Pick<Service, "requiresApproval">): "pending" | "confirmed" {
  return service.requiresApproval ? "pending" : "confirmed";
}
