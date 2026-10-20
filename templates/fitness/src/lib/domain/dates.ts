import { addDays, differenceInCalendarDays, format, startOfWeek } from "date-fns";
import type { ISODate, IsoWeekday, OpeningDay, TimeOfDay } from "./types";

/** Utility su date di calendario e orari locali. Funzioni pure, testate. */

export function isoWeekday(date: Date): IsoWeekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as IsoWeekday;
}

export function timeToMinutes(time: TimeOfDay): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number.parseInt(h, 10) * 60 + Number.parseInt(m, 10);
}

export function minutesToTime(minutes: number): TimeOfDay {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Data di calendario locale "YYYY-MM-DD" di un istante. */
export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

/** Mezzanotte locale di una data "YYYY-MM-DD". */
export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Combina una data "YYYY-MM-DD" e un orario "HH:mm" in ora locale. */
export function combineDateAndTime(date: ISODate, time: TimeOfDay): Date {
  const day = parseISODate(date);
  const minutes = timeToMinutes(time);
  day.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return day;
}

/** Giorni di calendario da "from" a "to" (negativo se "to" è nel passato). */
export function daysBetween(from: Date, to: ISODate): number {
  return differenceInCalendarDays(parseISODate(to), from);
}

/** Lunedì della settimana che contiene la data. */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** I 7 giorni (lunedì → domenica) della settimana che contiene la data. */
export function weekDays(date: Date): Date[] {
  const monday = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function openingFor(hours: readonly OpeningDay[], date: Date): OpeningDay | undefined {
  return hours.find((entry) => entry.day === isoWeekday(date));
}

/** Il club è aperto in quell'istante? */
export function isOpenAt(hours: readonly OpeningDay[], date: Date): boolean {
  const day = openingFor(hours, date);
  if (!day?.open) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= timeToMinutes(day.from) && minutes < timeToMinutes(day.to);
}

/** Prossima apertura dopo "now" (entro 7 giorni). */
export function nextOpening(hours: readonly OpeningDay[], now: Date): Date | null {
  for (let offset = 0; offset < 8; offset += 1) {
    const day = addDays(now, offset);
    const opening = openingFor(hours, day);
    if (!opening?.open) continue;
    const start = combineDateAndTime(toISODate(day), opening.from);
    if (start.getTime() > now.getTime()) return start;
  }
  return null;
}
