import { addDays } from "date-fns";
import { combineDateAndTime, isoWeekday, toISODate } from "./dates";
import type { ClassSession, Course, WeeklySlot } from "./types";

/** Palinsesto: dalla settimana tipo alle lezioni in calendario. */

/** ID stabile di una lezione generata: stesso slot e stessa data → stesso ID. */
export function sessionIdFor(slotId: string, date: string): string {
  return `${slotId}_${date.replaceAll("-", "")}`;
}

/**
 * Genera le lezioni dei giorni [from, from + days) a partire dal palinsesto.
 * Le lezioni già esistenti (stesso ID) non vengono duplicate.
 */
export function generateSessions(
  slots: readonly WeeklySlot[],
  courses: readonly Course[],
  from: Date,
  days: number,
  existing: readonly ClassSession[] = [],
): ClassSession[] {
  const known = new Set(existing.map((s) => s.id));
  const duration = new Map(courses.map((c) => [c.id, c.durationMin]));
  const created: ClassSession[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(from, offset);
    const date = toISODate(day);
    const weekday = isoWeekday(day);
    for (const slot of slots) {
      if (slot.weekday !== weekday) continue;
      const id = sessionIdFor(slot.id, date);
      if (known.has(id)) continue;
      created.push({
        id,
        slotId: slot.id,
        courseId: slot.courseId,
        instructorId: slot.instructorId,
        room: slot.room,
        start: combineDateAndTime(date, slot.time).toISOString(),
        durationMin: duration.get(slot.courseId) ?? 50,
        capacity: slot.capacity,
        cancelled: false,
      });
    }
  }
  return created.sort((a, b) => a.start.localeCompare(b.start));
}

/** Lezioni di un giorno, in ordine di orario. */
export function sessionsOn(sessions: readonly ClassSession[], date: string): ClassSession[] {
  return sessions
    .filter((s) => toISODate(new Date(s.start)) === date)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Palinsesto raggruppato per giorno della settimana (1 = lunedì). */
export function slotsByWeekday(slots: readonly WeeklySlot[]): Map<number, WeeklySlot[]> {
  const map = new Map<number, WeeklySlot[]>();
  for (let d = 1; d <= 7; d += 1) map.set(d, []);
  for (const slot of slots) map.get(slot.weekday)?.push(slot);
  for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
  return map;
}
