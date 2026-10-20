import type { Appointment, IsoWeekday, OpeningDay, TimeOfDay } from "./types";

/** Stati che occupano l'agenda (gli annullati liberano lo slot). */
export const BLOCKING_STATUSES = new Set<Appointment["status"]>([
  "pending",
  "confirmed",
  "completed",
]);

/** Giorno ISO della settimana (1 = lunedì … 7 = domenica). */
export function isoWeekday(date: Date): IsoWeekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as IsoWeekday;
}

export function timeToMinutes(time: TimeOfDay): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number.parseInt(h, 10) * 60 + Number.parseInt(m, 10);
}

export function minutesToTime(minutes: number): TimeOfDay {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Combina una data "AAAA-MM-GG" e un orario "HH:mm" in ora locale. */
export function combineDateAndTime(date: string, time: TimeOfDay): Date {
  const [y, mo, d] = date.split("-").map((part) => Number.parseInt(part, 10));
  const minutes = timeToMinutes(time);
  return new Date(y ?? 1970, (mo ?? 1) - 1, d ?? 1, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

/** Arrotonda all'intervallo più vicino (es. 15 minuti) verso il basso. */
export function floorToStep(minutes: number, step: number): number {
  return Math.floor(minutes / step) * step;
}

export function openingFor(hours: readonly OpeningDay[], date: Date): OpeningDay | undefined {
  const weekday = isoWeekday(date);
  return hours.find((entry) => entry.day === weekday);
}

/**
 * Restituisce gli appuntamenti dello stesso operatore che si sovrappongono
 * all'intervallo indicato. Gli estremi che si toccano non sono sovrapposizioni.
 */
export function findConflicts(
  appointments: readonly Appointment[],
  candidate: { staffId: string; start: Date; end: Date; ignoreId?: string },
): Appointment[] {
  const startMs = candidate.start.getTime();
  const endMs = candidate.end.getTime();
  return appointments.filter((appointment) => {
    if (appointment.id === candidate.ignoreId) return false;
    if (appointment.staffId !== candidate.staffId) return false;
    if (!BLOCKING_STATUSES.has(appointment.status)) return false;
    const aStart = new Date(appointment.start).getTime();
    const aEnd = new Date(appointment.end).getTime();
    return aStart < endMs && startMs < aEnd;
  });
}

export type HoursCheck = "ok" | "closed" | "outside";

/** Verifica che l'intervallo cada interamente nell'orario di apertura del giorno. */
export function checkOpeningHours(
  hours: readonly OpeningDay[],
  start: Date,
  end: Date,
): HoursCheck {
  const opening = openingFor(hours, start);
  if (!opening || !opening.open) return "closed";
  const from = timeToMinutes(opening.from);
  const to = timeToMinutes(opening.to);
  const startMin = minutesOfDay(start);
  const sameDay = start.toDateString() === end.toDateString();
  const endMin = sameDay ? minutesOfDay(end) : 24 * 60;
  return startMin >= from && endMin <= to ? "ok" : "outside";
}

/** Fascia oraria visibile in calendario: dall'apertura più presto alla chiusura più tardi. */
export function visibleHourRange(hours: readonly OpeningDay[]): {
  startHour: number;
  endHour: number;
} {
  const open = hours.filter((entry) => entry.open);
  if (open.length === 0) return { startHour: 8, endHour: 20 };
  const startHour = Math.floor(Math.min(...open.map((entry) => timeToMinutes(entry.from))) / 60);
  const endHour = Math.ceil(Math.max(...open.map((entry) => timeToMinutes(entry.to))) / 60);
  return {
    startHour: Math.max(0, startHour),
    endHour: Math.min(24, Math.max(endHour, startHour + 1)),
  };
}

/** Prossimo inizio disponibile arrotondato all'intervallo dell'agenda. */
export function nextSlotStart(now: Date, stepMinutes: number): Date {
  const next = new Date(now);
  next.setSeconds(0, 0);
  const minutes = next.getHours() * 60 + next.getMinutes();
  const rounded = Math.ceil((minutes + 1) / stepMinutes) * stepMinutes;
  next.setHours(0, rounded, 0, 0);
  return next;
}
