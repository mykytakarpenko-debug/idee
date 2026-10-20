import type { IsoWeekday, OpeningDay, ServiceWindow, TimeOfDay } from "./types";

/** Utility su orari e servizi (pranzo/cena). Funzioni pure, testate. */

export type ServiceKind = "lunch" | "dinner";

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

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Combina una data "AAAA-MM-GG" e un orario "HH:mm" in ora locale. */
export function combineDateAndTime(date: string, time: TimeOfDay): Date {
  const [y, mo, d] = date.split("-").map((part) => Number.parseInt(part, 10));
  const minutes = timeToMinutes(time);
  return new Date(y ?? 1970, (mo ?? 1) - 1, d ?? 1, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

export function openingFor(hours: readonly OpeningDay[], date: Date): OpeningDay | undefined {
  return hours.find((entry) => entry.day === isoWeekday(date));
}

/** Servizi aperti in una data, in ordine (pranzo, cena). */
export function servicesOn(
  hours: readonly OpeningDay[],
  date: Date,
): { kind: ServiceKind; window: ServiceWindow }[] {
  const opening = openingFor(hours, date);
  if (!opening) return [];
  const list: { kind: ServiceKind; window: ServiceWindow }[] = [];
  if (opening.lunch.open) list.push({ kind: "lunch", window: opening.lunch });
  if (opening.dinner.open) list.push({ kind: "dinner", window: opening.dinner });
  return list;
}

/** Servizio in corso (o null) in un dato istante. */
export function currentService(
  hours: readonly OpeningDay[],
  now: Date,
): { kind: ServiceKind; window: ServiceWindow } | null {
  const minutes = minutesOfDay(now);
  return (
    servicesOn(hours, now).find(
      ({ window }) => minutes >= timeToMinutes(window.from) && minutes < timeToMinutes(window.to),
    ) ?? null
  );
}

/** Prossima apertura a partire da "now" (entro 7 giorni). */
export function nextOpening(
  hours: readonly OpeningDay[],
  now: Date,
): { date: Date; kind: ServiceKind } | null {
  for (let offset = 0; offset < 8; offset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    for (const { kind, window } of servicesOn(hours, day)) {
      const start = new Date(day);
      start.setMinutes(timeToMinutes(window.from));
      if (start.getTime() > now.getTime()) return { date: start, kind };
    }
  }
  return null;
}

/** Classifica un orario come pranzo (prima delle 17:00) o cena. */
export function serviceOf(date: Date): ServiceKind {
  return minutesOfDay(date) < 17 * 60 ? "lunch" : "dinner";
}

/**
 * Orario "rappresentativo" del prossimo servizio di oggi (apertura + offset),
 * usato per mostrare la sala piena quando il locale è ancora chiuso.
 * Null se un servizio è in corso o se oggi non ce ne sono altri.
 */
export function upcomingServiceTime(
  hours: readonly OpeningDay[],
  now: Date,
  offsetMin = 60,
): TimeOfDay | null {
  if (currentService(hours, now)) return null;
  const minutes = minutesOfDay(now);
  const next = servicesOn(hours, now).find(({ window }) => timeToMinutes(window.from) > minutes);
  if (!next) return null;
  const from = timeToMinutes(next.window.from);
  const to = timeToMinutes(next.window.to);
  return minutesToTime(Math.min(from + offsetMin, to - 30));
}
