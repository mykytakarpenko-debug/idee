import { addDays, differenceInCalendarDays, format } from "date-fns";
import type { ISODate } from "./types";

/** Utility su date di calendario locali. Funzioni pure, testate. */

/** Data di calendario locale "YYYY-MM-DD" di un istante. */
export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

/** Mezzanotte locale di una data "YYYY-MM-DD". */
export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Sposta una data "YYYY-MM-DD" di n giorni. */
export function shiftISODate(value: ISODate, days: number): ISODate {
  return toISODate(addDays(parseISODate(value), days));
}

/** Giorni di calendario da "from" a "to" (negativo se "to" è prima). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

/** La data (YYYY-MM-DD) cade nell'intervallo [from, to] incluso? */
export function isWithin(date: ISODate, from: ISODate, to: ISODate): boolean {
  return date >= from && date <= to;
}
