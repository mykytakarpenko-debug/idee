import { addDays, differenceInCalendarDays, format, startOfWeek } from "date-fns";
import type { ISODate } from "./types";

/** Utility su date di calendario locali. Funzioni pure, testate. */

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function shiftISODate(value: ISODate, days: number): ISODate {
  return toISODate(addDays(parseISODate(value), days));
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

/** Lunedì della settimana che contiene la data. */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}
